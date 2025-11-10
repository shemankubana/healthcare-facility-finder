#!/usr/bin/env python3
"""
Download Sentinel-2 and WorldCover data in tiles (stays under 50MB limit)

This script downloads data for Rwanda by splitting it into smaller tiles,
then merges them into final sentinel.tif and labels.tif files.
"""

import ee
import requests
from pathlib import Path
import sys
import time
import rasterio
from rasterio.merge import merge

def initialize_ee():
    """Initialize Earth Engine"""
    try:
        ee.Initialize()
        print("✓ Earth Engine initialized")
        return True
    except Exception as e:
        print(f"❌ Earth Engine not authenticated.")
        print("\nPlease authenticate first by running:")
        print("  python -c 'import ee; ee.Authenticate()'")
        return False


def download_tile(image, bounds, output_path, description):
    """Download a single tile from Earth Engine"""
    try:
        url = image.getDownloadURL({
            'scale': 30,
            'region': bounds,
            'format': 'GEO_TIFF',
            'maxPixels': 1e13
        })

        response = requests.get(url, stream=True)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))

        # Check if under 50MB limit
        if total_size > 50 * 1024 * 1024:
            print(f"    ⚠️  Tile too large ({total_size/(1024*1024):.1f}MB), skipping...")
            return None

        downloaded = 0
        chunk_size = 8192

        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)

        size_mb = output_path.stat().st_size / (1024 * 1024)
        print(f"    ✓ Downloaded {description}: {size_mb:.1f}MB")
        return output_path

    except Exception as e:
        print(f"    ❌ Failed: {e}")
        return None


def create_grid(bounds, num_tiles_x, num_tiles_y):
    """Create a grid of smaller bounding boxes"""
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


def merge_tiles(tile_files, output_path):
    """Merge multiple GeoTIFF tiles into one file using rasterio"""
    tile_paths = [str(f) for f in tile_files if f.exists()]
    if not tile_paths:
        print("  ❌ No tiles to merge")
        return False

    datasets = [rasterio.open(tp) for tp in tile_paths]
    mosaic, out_trans = merge(datasets)

    out_meta = datasets[0].meta.copy()
    out_meta.update({
        "driver": "GTiff",
        "height": mosaic.shape[1],
        "width": mosaic.shape[2],
        "transform": out_trans,
        "compress": "LZW"
    })

    with rasterio.open(output_path, "w", **out_meta) as dest:
        dest.write(mosaic)

    # Close datasets and delete tiles
    for ds in datasets:
        ds.close()
    for tile_path in tile_paths:
        Path(tile_path).unlink()

    size_mb = Path(output_path).stat().st_size / (1024*1024)
    print(f"  ✓ Merged into {output_path.name}: {size_mb:.1f}MB")
    return True


def download_rwanda_data():
    """Download both Sentinel-2 and WorldCover for Rwanda in tiles"""
    print("="*70)
    print("DOWNLOADING RWANDA DATA IN TILES")
    print("="*70)
    print()

    if not initialize_ee():
        return 1

    temp_dir = Path("temp_tiles")
    temp_dir.mkdir(exist_ok=True)

    rwanda_bounds = [28.85, -2.85, 30.90, -1.05]

    print("Creating tile grid (4x4 = 16 tiles)...")
    tiles = create_grid(rwanda_bounds, 4, 4)
    print(f"✓ Created {len(tiles)} tiles\n")

    # Sentinel-2 imagery
    print("Loading Sentinel-2 imagery...")
    rwanda = ee.FeatureCollection('FAO/GAUL/2015/level0').filter(
        ee.Filter.eq('ADM0_NAME', 'Rwanda')
    )

    sentinel2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                 .filterBounds(rwanda)
                 .filterDate('2025-01-01', '2025-09-30')
                 .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                 .select(['B4', 'B3', 'B2', 'B8', 'B11', 'B12']))

    sentinel_median = sentinel2.median().clip(rwanda)
    print("✓ Sentinel-2 loaded\n")

    # WorldCover
    print("Loading ESA WorldCover...")
    worldcover = ee.Image('ESA/WorldCover/v200/2021').select('Map').clip(rwanda)
    print("✓ WorldCover loaded\n")

    # Download Sentinel tiles
    print("Downloading Sentinel-2 tiles...")
    sentinel_tiles = []
    for i, tile_bounds in enumerate(tiles, 1):
        print(f"  Tile {i}/{len(tiles)}...")
        tile_geom = ee.Geometry.Rectangle(tile_bounds)
        tile_path = temp_dir / f"sentinel_tile_{i}.tif"

        result = download_tile(sentinel_median, tile_geom, tile_path, f"Sentinel tile {i}")
        if result:
            sentinel_tiles.append(tile_path)
        time.sleep(1)

    # Download WorldCover tiles
    print("\nDownloading WorldCover tiles...")
    worldcover_tiles = []
    for i, tile_bounds in enumerate(tiles, 1):
        print(f"  Tile {i}/{len(tiles)}...")
        tile_geom = ee.Geometry.Rectangle(tile_bounds)
        tile_path = temp_dir / f"worldcover_tile_{i}.tif"

        result = download_tile(worldcover, tile_geom, tile_path, f"WorldCover tile {i}")
        if result:
            worldcover_tiles.append(tile_path)
        time.sleep(1)

    print("\n" + "="*70)
    print("MERGING TILES")
    print("="*70)

    sentinel_output = Path("sentinel.tif")
    labels_output = Path("labels.tif")

    print("\nMerging Sentinel-2 tiles...")
    if not merge_tiles(sentinel_tiles, sentinel_output):
        print("❌ Failed to merge Sentinel tiles")
        return 1

    print("\nMerging WorldCover tiles...")
    if not merge_tiles(worldcover_tiles, labels_output):
        print("❌ Failed to merge WorldCover tiles")
        return 1

    try:
        temp_dir.rmdir()
    except:
        pass

    print("\n" + "="*70)
    print("SUCCESS!")
    print("="*70)
    print(f"\n✓ sentinel.tif: {sentinel_output.stat().st_size / (1024*1024):.1f}MB")
    print(f"✓ labels.tif: {labels_output.stat().st_size / (1024*1024):.1f}MB")
    print("\nYou can now run: python train_model.py\n")

    return 0


def download_kigali_only():
    """Download just Kigali region (much faster for testing)"""
    print("="*70)
    print("DOWNLOADING KIGALI REGION (FAST)")
    print("="*70)
    print()

    if not initialize_ee():
        return 1

    kigali_bounds = ee.Geometry.Rectangle([29.95, -2.05, 30.25, -1.85])

    print("Loading Sentinel-2 for Kigali...")
    sentinel2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                 .filterBounds(kigali_bounds)
                 .filterDate('2025-01-01', '2025-09-30')
                 .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                 .select(['B4', 'B3', 'B2', 'B8', 'B11', 'B12']))

    sentinel_median = sentinel2.median().clip(kigali_bounds)
    print("✓ Sentinel-2 loaded")

    print("Loading WorldCover for Kigali...")
    worldcover = ee.Image('ESA/WorldCover/v200/2021').select('Map').clip(kigali_bounds)
    print("✓ WorldCover loaded\n")

    sentinel_path = Path("sentinel.tif")
    if download_tile(sentinel_median, kigali_bounds, sentinel_path, "Sentinel-2"):
        print(f"✓ sentinel.tif: {sentinel_path.stat().st_size / (1024*1024):.1f}MB")
    else:
        print("❌ Failed to download Sentinel-2")
        return 1

    labels_path = Path("labels.tif")
    if download_tile(worldcover, kigali_bounds, labels_path, "WorldCover"):
        print(f"✓ labels.tif: {labels_path.stat().st_size / (1024*1024):.1f}MB")
    else:
        print("❌ Failed to download WorldCover")
        return 1

    print("\n" + "="*70)
    print("SUCCESS!")
    print("="*70)
    print("\nKigali data downloaded successfully!")
    print("This is perfect for testing the system.")
    print("\nYou can now run: python train_model.py\n")

    return 0


if __name__ == "__main__":
    print("\n🛰️  Rwanda Data Download Tool\n")
    print("Choose download option:\n")
    print("1. Download Kigali only (FAST - 2-5 minutes, ~5-10MB)")
    print("   → Perfect for testing the system\n")
    print("2. Download full Rwanda in tiles (SLOW - 20-40 minutes, ~100-200MB)")
    print("   → For production deployment\n")
    print("3. Exit\n")

    choice = input("Enter choice (1-3): ").strip()

    if choice == "1":
        print("\n📍 Downloading Kigali region...\n")
        sys.exit(download_kigali_only())
    elif choice == "2":
        print("\n🌍 Downloading full Rwanda in tiles...\n")
        print("⚠️  This will take 20-40 minutes and make ~32 API calls")
        print("   (16 tiles × 2 datasets)")
        confirm = input("\nContinue? (yes/no): ").strip().lower()
        if confirm == "yes":
            sys.exit(download_rwanda_data())
        else:
            print("Cancelled.")
            sys.exit(0)
    else:
        print("Exiting.")
        sys.exit(0)
#!/usr/bin/env python3
"""
Download Sentinel-2 and WorldCover data in tiles (stays under 50MB limit)

This script downloads data for Rwanda by splitting it into smaller tiles,
then merges them into final sentinel.tif and labels.tif files.
"""

import ee
import requests
from pathlib import Path
import sys
import time
import rasterio
from rasterio.merge import merge

def initialize_ee():
    """Initialize Earth Engine"""
    try:
        ee.Initialize()
        print("✓ Earth Engine initialized")
        return True
    except Exception as e:
        print(f"❌ Earth Engine not authenticated.")
        print("\nPlease authenticate first by running:")
        print("  python -c 'import ee; ee.Authenticate()'")
        return False


def download_tile(image, bounds, output_path, description):
    """Download a single tile from Earth Engine"""
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

        # Check if under 50MB limit
        if total_size > 50 * 1024 * 1024:
            print(f"    ⚠️  Tile too large ({total_size/(1024*1024):.1f}MB), skipping...")
            return None

        downloaded = 0
        chunk_size = 8192

        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)

        size_mb = output_path.stat().st_size / (1024 * 1024)
        print(f"    ✓ Downloaded {description}: {size_mb:.1f}MB")
        return output_path

    except Exception as e:
        print(f"    ❌ Failed: {e}")
        return None


def create_grid(bounds, num_tiles_x, num_tiles_y):
    """Create a grid of smaller bounding boxes"""
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


def merge_tiles(tile_files, output_path):
    """Merge multiple GeoTIFF tiles into one file using rasterio"""
    tile_paths = [str(f) for f in tile_files if f.exists()]
    if not tile_paths:
        print("  ❌ No tiles to merge")
        return False

    datasets = [rasterio.open(tp) for tp in tile_paths]
    mosaic, out_trans = merge(datasets)

    out_meta = datasets[0].meta.copy()
    out_meta.update({
        "driver": "GTiff",
        "height": mosaic.shape[1],
        "width": mosaic.shape[2],
        "transform": out_trans,
        "compress": "LZW"
    })

    with rasterio.open(output_path, "w", **out_meta) as dest:
        dest.write(mosaic)

    # Close datasets and delete tiles
    for ds in datasets:
        ds.close()
    for tile_path in tile_paths:
        Path(tile_path).unlink()

    size_mb = Path(output_path).stat().st_size / (1024*1024)
    print(f"  ✓ Merged into {output_path.name}: {size_mb:.1f}MB")
    return True


def download_rwanda_data():
    """Download both Sentinel-2 and WorldCover for Rwanda in tiles"""
    print("="*70)
    print("DOWNLOADING RWANDA DATA IN TILES")
    print("="*70)
    print()

    if not initialize_ee():
        return 1

    temp_dir = Path("temp_tiles")
    temp_dir.mkdir(exist_ok=True)

    rwanda_bounds = [28.85, -2.85, 30.90, -1.05]

    print("Creating tile grid (4x4 = 16 tiles)...")
    tiles = create_grid(rwanda_bounds, 4, 4)
    print(f"✓ Created {len(tiles)} tiles\n")

    # Sentinel-2 imagery
    print("Loading Sentinel-2 imagery...")
    rwanda = ee.FeatureCollection('FAO/GAUL/2015/level0').filter(
        ee.Filter.eq('ADM0_NAME', 'Rwanda')
    )

    sentinel2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                 .filterBounds(rwanda)
                 .filterDate('2025-01-01', '2025-09-30')
                 .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                 .select(['B4', 'B3', 'B2', 'B8', 'B11', 'B12']))

    sentinel_median = sentinel2.median().clip(rwanda)
    print("✓ Sentinel-2 loaded\n")

    # WorldCover
    print("Loading ESA WorldCover...")
    worldcover = ee.Image('ESA/WorldCover/v200/2021').select('Map').clip(rwanda)
    print("✓ WorldCover loaded\n")

    # Download Sentinel tiles
    print("Downloading Sentinel-2 tiles...")
    sentinel_tiles = []
    for i, tile_bounds in enumerate(tiles, 1):
        print(f"  Tile {i}/{len(tiles)}...")
        tile_geom = ee.Geometry.Rectangle(tile_bounds)
        tile_path = temp_dir / f"sentinel_tile_{i}.tif"

        result = download_tile(sentinel_median, tile_geom, tile_path, f"Sentinel tile {i}")
        if result:
            sentinel_tiles.append(tile_path)
        time.sleep(1)

    # Download WorldCover tiles
    print("\nDownloading WorldCover tiles...")
    worldcover_tiles = []
    for i, tile_bounds in enumerate(tiles, 1):
        print(f"  Tile {i}/{len(tiles)}...")
        tile_geom = ee.Geometry.Rectangle(tile_bounds)
        tile_path = temp_dir / f"worldcover_tile_{i}.tif"

        result = download_tile(worldcover, tile_geom, tile_path, f"WorldCover tile {i}")
        if result:
            worldcover_tiles.append(tile_path)
        time.sleep(1)

    print("\n" + "="*70)
    print("MERGING TILES")
    print("="*70)

    sentinel_output = Path("sentinel.tif")
    labels_output = Path("labels.tif")

    print("\nMerging Sentinel-2 tiles...")
    if not merge_tiles(sentinel_tiles, sentinel_output):
        print("❌ Failed to merge Sentinel tiles")
        return 1

    print("\nMerging WorldCover tiles...")
    if not merge_tiles(worldcover_tiles, labels_output):
        print("❌ Failed to merge WorldCover tiles")
        return 1

    try:
        temp_dir.rmdir()
    except:
        pass

    print("\n" + "="*70)
    print("SUCCESS!")
    print("="*70)
    print(f"\n✓ sentinel.tif: {sentinel_output.stat().st_size / (1024*1024):.1f}MB")
    print(f"✓ labels.tif: {labels_output.stat().st_size / (1024*1024):.1f}MB")
    print("\nYou can now run: python train_model.py\n")

    return 0


def download_kigali_only():
    """Download just Kigali region (much faster for testing)"""
    print("="*70)
    print("DOWNLOADING KIGALI REGION (FAST)")
    print("="*70)
    print()

    if not initialize_ee():
        return 1

    kigali_bounds = ee.Geometry.Rectangle([29.95, -2.05, 30.25, -1.85])

    print("Loading Sentinel-2 for Kigali...")
    sentinel2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                 .filterBounds(kigali_bounds)
                 .filterDate('2025-01-01', '2025-09-30')
                 .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                 .select(['B4', 'B3', 'B2', 'B8', 'B11', 'B12']))

    sentinel_median = sentinel2.median().clip(kigali_bounds)
    print("✓ Sentinel-2 loaded")

    print("Loading WorldCover for Kigali...")
    worldcover = ee.Image('ESA/WorldCover/v200/2021').select('Map').clip(kigali_bounds)
    print("✓ WorldCover loaded\n")

    sentinel_path = Path("sentinel.tif")
    if download_tile(sentinel_median, kigali_bounds, sentinel_path, "Sentinel-2"):
        print(f"✓ sentinel.tif: {sentinel_path.stat().st_size / (1024*1024):.1f}MB")
    else:
        print("❌ Failed to download Sentinel-2")
        return 1

    labels_path = Path("labels.tif")
    if download_tile(worldcover, kigali_bounds, labels_path, "WorldCover"):
        print(f"✓ labels.tif: {labels_path.stat().st_size / (1024*1024):.1f}MB")
    else:
        print("❌ Failed to download WorldCover")
        return 1

    print("\n" + "="*70)
    print("SUCCESS!")
    print("="*70)
    print("\nKigali data downloaded successfully!")
    print("This is perfect for testing the system.")
    print("\nYou can now run: python train_model.py\n")

    return 0


if __name__ == "__main__":
    print("\n🛰️  Rwanda Data Download Tool\n")
    print("Choose download option:\n")
    print("1. Download Kigali only (FAST - 2-5 minutes, ~5-10MB)")
    print("   → Perfect for testing the system\n")
    print("2. Download full Rwanda in tiles (SLOW - 20-40 minutes, ~100-200MB)")
    print("   → For production deployment\n")
    print("3. Exit\n")

    choice = input("Enter choice (1-3): ").strip()

    if choice == "1":
        print("\n📍 Downloading Kigali region...\n")
        sys.exit(download_kigali_only())
    elif choice == "2":
        print("\n🌍 Downloading full Rwanda in tiles...\n")
        print("⚠️  This will take 20-40 minutes and make ~32 API calls")
        print("   (16 tiles × 2 datasets)")
        confirm = input("\nContinue? (yes/no): ").strip().lower()
        if confirm == "yes":
            sys.exit(download_rwanda_data())
        else:
            print("Cancelled.")
            sys.exit(0)
    else:
        print("Exiting.")
        sys.exit(0)
