#!/usr/bin/env python3
"""
Download Sentinel-2 and WorldCover data (stays under 50MB limit)

Simple version: Downloads Kigali region which fits under the 50MB limit.
Perfect for testing and development!
"""

import ee
import requests
from pathlib import Path
import sys


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


def download_image(image, bounds, output_path, description):
    """Download a single image from Earth Engine"""
    try:
        print(f"\nDownloading {description}...")

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
            print(f"  ❌ File too large ({size_mb:.1f}MB) - exceeds 50MB limit")
            print(f"  Try a smaller region or use Google Drive export")
            return False

        print(f"  File size: {size_mb:.1f}MB")
        print(f"  Downloading...")

        downloaded = 0
        chunk_size = 8192

        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"    Progress: {percent:.1f}%", end='\r')

        print(f"\n  ✓ Downloaded: {output_path.name}")
        return True

    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


def download_kigali():
    """Download Kigali region (fits under 50MB limit)"""

    print("="*70)
    print("DOWNLOADING KIGALI REGION DATA")
    print("="*70)
    print()
    print("Region: Kigali City")
    print("Area: ~730 km²")
    print("Expected size: ~5-15MB per file")
    print()

    if not initialize_ee():
        return 1

    # Kigali bounds (carefully sized to stay under 50MB)
    kigali_bounds = ee.Geometry.Rectangle([29.95, -2.05, 30.25, -1.85])

    # Load Sentinel-2
    print("Loading Sentinel-2 imagery...")
    sentinel2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                 .filterBounds(kigali_bounds)
                 .filterDate('2025-01-01', '2025-09-30')
                 .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                 .select(['B4', 'B3', 'B2', 'B8']))  # RGB + NIR (4 bands to reduce size)

    sentinel_median = sentinel2.median().clip(kigali_bounds)
    print("✓ Sentinel-2 ready")

    # Load WorldCover
    print("Loading ESA WorldCover...")
    worldcover = ee.Image('ESA/WorldCover/v200/2021').select('Map').clip(kigali_bounds)
    print("✓ WorldCover ready")

    # Download Sentinel
    sentinel_path = Path("sentinel.tif")
    sentinel_ok = download_image(sentinel_median, kigali_bounds, sentinel_path, "Sentinel-2 (RGB+NIR)")

    if not sentinel_ok:
        print("\n❌ Failed to download Sentinel-2")
        return 1

    # Download WorldCover
    labels_path = Path("labels.tif")
    labels_ok = download_image(worldcover, kigali_bounds, labels_path, "WorldCover Labels")

    if not labels_ok:
        print("\n❌ Failed to download WorldCover")
        return 1

    # Success!
    print("\n" + "="*70)
    print("✅ SUCCESS!")
    print("="*70)
    print()
    print(f"✓ sentinel.tif: {sentinel_path.stat().st_size / (1024*1024):.2f}MB")
    print(f"✓ labels.tif: {labels_path.stat().st_size / (1024*1024):.2f}MB")
    print()
    print("📍 Region: Kigali City")
    print("🎯 Ready for model training!")
    print()
    print("Next step: python train_model.py")
    print()

    return 0


def download_custom_region():
    """Download a custom region with user-specified bounds"""

    print("="*70)
    print("CUSTOM REGION DOWNLOAD")
    print("="*70)
    print()
    print("Enter coordinates for your region:")
    print("(Keep area small to stay under 50MB - about 30km x 30km max)")
    print()

    if not initialize_ee():
        return 1

    try:
        min_lon = float(input("Min Longitude (e.g., 29.95): "))
        min_lat = float(input("Min Latitude (e.g., -2.05): "))
        max_lon = float(input("Max Longitude (e.g., 30.25): "))
        max_lat = float(input("Max Latitude (e.g., -1.85): "))

        custom_bounds = ee.Geometry.Rectangle([min_lon, min_lat, max_lon, max_lat])

        # Calculate approximate area
        area_km2 = custom_bounds.area().divide(1e6).getInfo()
        print(f"\nRegion area: ~{area_km2:.1f} km²")

        if area_km2 > 1000:
            print("⚠️  Warning: Large area may exceed 50MB limit")
            confirm = input("Continue anyway? (yes/no): ").strip().lower()
            if confirm != "yes":
                return 0

        # Load Sentinel-2
        print("\nLoading Sentinel-2...")
        sentinel2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                     .filterBounds(custom_bounds)
                     .filterDate('2025-01-01', '2025-09-30')
                     .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                     .select(['B4', 'B3', 'B2', 'B8']))

        sentinel_median = sentinel2.median().clip(custom_bounds)
        print("✓ Sentinel-2 ready")

        # Load WorldCover
        print("Loading WorldCover...")
        worldcover = ee.Image('ESA/WorldCover/v200/2021').select('Map').clip(custom_bounds)
        print("✓ WorldCover ready")

        # Download
        sentinel_path = Path("sentinel.tif")
        sentinel_ok = download_image(sentinel_median, custom_bounds, sentinel_path, "Sentinel-2")

        if not sentinel_ok:
            return 1

        labels_path = Path("labels.tif")
        labels_ok = download_image(worldcover, custom_bounds, labels_path, "WorldCover")

        if not labels_ok:
            return 1

        print("\n✅ Custom region downloaded successfully!")
        print("\nNext step: python train_model.py")
        return 0

    except ValueError:
        print("❌ Invalid coordinates")
        return 1
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1


if __name__ == "__main__":
    print("\n🛰️  Data Download Tool (50MB Limit Compliant)\n")
    print("Choose download option:")
    print()
    print("1. Download Kigali region (RECOMMENDED)")
    print("   → ~730 km², perfect for testing")
    print("   → ~5-15MB per file")
    print("   → Takes 2-3 minutes")
    print()
    print("2. Download custom region")
    print("   → Specify your own coordinates")
    print("   → Keep area <1000 km² to stay under limit")
    print()
    print("3. Exit")
    print()

    choice = input("Enter choice (1-3): ").strip()

    if choice == "1":
        print()
        sys.exit(download_kigali())
    elif choice == "2":
        print()
        sys.exit(download_custom_region())
    else:
        print("Exiting.")
        sys.exit(0)
