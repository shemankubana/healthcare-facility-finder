#!/usr/bin/env python3
"""
Download Rwanda data in tiles and merge (no GDAL required)

Uses rasterio instead of GDAL - much simpler to install!
"""

import ee
import requests
from pathlib import Path
import sys
import numpy as np
import time

def initialize_ee():
    """Initialize Earth Engine"""
    try:
        ee.Initialize()
        print("✓ Earth Engine initialized")
        return True
    except Exception as e:
        print(f"❌ Earth Engine not authenticated.")
        print("\nPlease authenticate first:")
        print("  python -c 'import ee; ee.Authenticate()'")
        return False


def download_tile(image, bounds, output_path, description):
    """Download a single tile"""
    try:
        url = image.getDownloadURL({
            'scale': 10,
            'region': bounds,
            'format': 'GEO_TIFF',
            'maxPixels': 1e13
        })

        response = requests.get(url, stream=True)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))
        size_mb = total_size / (1024 * 1024)

        # Check size
        if total_size > 50 * 1024 * 1024:
            print(f"    ⚠️  Tile too large ({size_mb:.1f}MB), skipping...")
            return None

        # Download
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(8192):
                if chunk:
                    f.write(chunk)

        print(f"    ✓ {description}: {size_mb:.1f}MB")
        return output_path

    except Exception as e:
        print(f"    ❌ Failed: {e}")
        return None


def merge_tiles_rasterio(tile_files, output_path):
    """Merge tiles using rasterio (no GDAL needed)"""
    try:
        import rasterio
        from rasterio.merge import merge
        from rasterio.plot import show
    except ImportError:
        print("❌ rasterio not installed")
        print("\nInstall it with: pip install rasterio")
        return False

    print(f"\n  Merging {len(tile_files)} tiles...")

    tile_paths = [str(f) for f in tile_files if f.exists()]

    if not tile_paths:
        print("  ❌ No tiles to merge")
        return False

    # Open all tiles
    src_files = [rasterio.open(f) for f in tile_paths]

    # Merge
    mosaic, out_transform = merge(src_files)

    # Get metadata from first tile
    out_meta = src_files[0].meta.copy()
    out_meta.update({
        "driver": "GTiff",
        "height": mosaic.shape[1],
        "width": mosaic.shape[2],
        "transform": out_transform,
        "compress": "lzw"
    })

    # Write merged file
    with rasterio.open(output_path, "w", **out_meta) as dest:
        dest.write(mosaic)

    # Close source files
    for src in src_files:
        src.close()

    # Clean up tile files
    for tile_path in tile_paths:
        Path(tile_path).unlink()

    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"  ✓ Merged: {size_mb:.1f}MB")
    return True


def create_grid(bounds, num_tiles_x, num_tiles_y):
    """Create a grid of bounding boxes"""
    min_lon, min_lat, max_lon, max_lat = bounds

    lon_step = (max_lon - min_lon) / num_tiles_x
    lat_step = (max_lat - min_lat) / num_tiles_y

    tiles = []
    for i in range(num_tiles_x):
        for j in range(num_tiles_y):
            tile_bounds = [
                min_lon + i * lon_step,
                min_lat + j * lat_step,
                min_lon + (i + 1) * lon_step,
                min_lat + (j + 1) * lat_step
            ]
            tiles.append(tile_bounds)

    return tiles


def download_rwanda_tiles():
    """Download full Rwanda in tiles"""

    print("="*70)
    print("DOWNLOADING FULL RWANDA IN TILES")
    print("="*70)
    print()
    print("This will download Rwanda in 16 tiles (4x4 grid)")
    print("Each tile will be under 50MB")
    print("Total time: ~20-30 minutes")
    print()

    # Check rasterio
    try:
        import rasterio
    except ImportError:
        print("❌ rasterio is required for merging tiles")
        print("\nInstall it with: pip install rasterio")
        return 1

    if not initialize_ee():
        return 1

    # Create temp directory
    temp_dir = Path("temp_tiles")
    temp_dir.mkdir(exist_ok=True)

    # Rwanda bounds
    rwanda_bounds = [28.85, -2.85, 30.90, -1.05]

    # Create grid (4x4 = 16 tiles)
    print("Creating 4x4 tile grid (16 tiles)...")
    tiles = create_grid(rwanda_bounds, 4, 4)
    print(f"✓ Created {len(tiles)} tiles\n")

    # Load imagery
    print("Loading Sentinel-2...")
    rwanda = ee.FeatureCollection('FAO/GAUL/2015/level0').filter(
        ee.Filter.eq('ADM0_NAME', 'Rwanda')
    )

    sentinel2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                 .filterBounds(rwanda)
                 .filterDate('2025-01-01', '2025-09-30')
                 .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                 .select(['B4', 'B3', 'B2', 'B8']))

    sentinel_median = sentinel2.median().clip(rwanda)
    print("✓ Sentinel-2 ready")

    print("Loading WorldCover...")
    worldcover = ee.Image('ESA/WorldCover/v200/2021').select('Map').clip(rwanda)
    print("✓ WorldCover ready\n")

    # Download Sentinel tiles
    print("Downloading Sentinel-2 tiles...")
    sentinel_tiles = []
    for i, tile_bounds in enumerate(tiles, 1):
        print(f"  Tile {i}/{len(tiles)}...")
        tile_geom = ee.Geometry.Rectangle(tile_bounds)
        tile_path = temp_dir / f"sentinel_{i}.tif"

        result = download_tile(sentinel_median, tile_geom, tile_path, f"Sentinel {i}")
        if result:
            sentinel_tiles.append(tile_path)

        time.sleep(1)  # Rate limiting

    # Download WorldCover tiles
    print("\nDownloading WorldCover tiles...")
    worldcover_tiles = []
    for i, tile_bounds in enumerate(tiles, 1):
        print(f"  Tile {i}/{len(tiles)}...")
        tile_geom = ee.Geometry.Rectangle(tile_bounds)
        tile_path = temp_dir / f"labels_{i}.tif"

        result = download_tile(worldcover, tile_geom, tile_path, f"Labels {i}")
        if result:
            worldcover_tiles.append(tile_path)

        time.sleep(1)  # Rate limiting

    # Merge tiles
    print("\n" + "="*70)
    print("MERGING TILES")
    print("="*70)

    # Merge Sentinel
    print("\nMerging Sentinel-2...")
    sentinel_output = Path("sentinel.tif")
    if not merge_tiles_rasterio(sentinel_tiles, sentinel_output):
        print("❌ Failed to merge Sentinel tiles")
        return 1

    # Merge WorldCover
    print("\nMerging WorldCover...")
    labels_output = Path("labels.tif")
    if not merge_tiles_rasterio(worldcover_tiles, labels_output):
        print("❌ Failed to merge WorldCover tiles")
        return 1

    # Clean up
    try:
        temp_dir.rmdir()
    except:
        pass

    # Success!
    print("\n" + "="*70)
    print("✅ SUCCESS!")
    print("="*70)
    print(f"\n✓ sentinel.tif: {sentinel_output.stat().st_size / (1024*1024):.1f}MB")
    print(f"✓ labels.tif: {labels_output.stat().st_size / (1024*1024):.1f}MB")
    print("\nNext step: python train_model.py")
    print()

    return 0


if __name__ == "__main__":
    print("\n🛰️  Rwanda Data Download (No GDAL Required)\n")
    print("This script uses rasterio to merge tiles (much simpler than GDAL)")
    print()

    # Check if rasterio is installed
    try:
        import rasterio
        print("✓ rasterio is installed\n")
    except ImportError:
        print("❌ rasterio is not installed")
        print("\nInstall it with:")
        print("  pip install rasterio")
        print()
        sys.exit(1)

    print("This will:")
    print("  - Download Rwanda in 16 tiles (4x4 grid)")
    print("  - Each tile < 50MB")
    print("  - Merge tiles using rasterio")
    print("  - Total time: ~20-30 minutes")
    print()

    confirm = input("Continue? (yes/no): ").strip().lower()

    if confirm == "yes":
        sys.exit(download_rwanda_tiles())
    else:
        print("\nCancelled.")
        print("\nFor faster testing, use: python download_data_simple.py")
        print("(Downloads just Kigali region in 2-3 minutes)")
        sys.exit(0)
