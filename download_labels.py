#!/usr/bin/env python3
"""
Download ESA WorldCover labels for Rwanda

This script downloads the ESA WorldCover 2021 land cover classification
for Rwanda, which is used as training labels for the ML model.

Note: Full Rwanda is too large for direct download (>900MB).
Use Google Drive export or download a smaller region (like Kigali).
"""

import ee
import requests
from pathlib import Path
import sys

def download_kigali_only():
    """Download WorldCover labels from Google Earth Engine"""

    print("="*70)
    print("DOWNLOADING ESA WORLDCOVER LABELS")
    print("="*70)
    print()

    try:
        # Initialize Earth Engine
        print("Initializing Google Earth Engine...")
        try:
            ee.Initialize()
            print("✓ Earth Engine initialized")
        except Exception as e:
            print(f"❌ Earth Engine not authenticated.")
            print("\nPlease authenticate first by running:")
            print("  ee.Authenticate()")
            print("\nOr run:")
            print("  python -c 'import ee; ee.Authenticate()'")
            return 1

        # Define Rwanda boundaries
        print("\nDefining Rwanda boundaries...")
        rwanda = ee.FeatureCollection('FAO/GAUL/2015/level0').filter(
            ee.Filter.eq('ADM0_NAME', 'Rwanda')
        )

        # Load ESA WorldCover
        print("Loading ESA WorldCover 2021...")
        worldcover = ee.Image('ESA/WorldCover/v200/2021').select('Map').clip(rwanda)

        # Get region bounds
        region = rwanda.geometry().bounds().getInfo()['coordinates']

        print("\nPreparing download...")
        output_path = Path("labels.tif")

        # Get download URL
        url = worldcover.getDownloadURL({
            'scale': 10,  # 10m resolution
            'region': region,
            'format': 'GEO_TIFF',
            'maxPixels': 1e13
        })

        print(f"Downloading from Earth Engine...")
        print("(This may take several minutes for the full Rwanda dataset)")

        # Download the file
        response = requests.get(url, stream=True)
        response.raise_for_status()

        # Get file size
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        chunk_size = 8192

        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        mb_downloaded = downloaded / (1024 * 1024)
                        mb_total = total_size / (1024 * 1024)
                        print(f"  Progress: {percent:.1f}% ({mb_downloaded:.1f}MB / {mb_total:.1f}MB)", end='\r')

        print(f"\n\n✅ SUCCESS!")
        print(f"📁 Labels saved to: {output_path.absolute()}")
        print(f"📊 File size: {output_path.stat().st_size / (1024*1024):.2f} MB")
        print()
        print("You can now run: python train_model.py")
        print()

        return 0

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nIf download failed, try Option 2 below.")
        return 1


def export_to_drive():
    """Export labels to Google Drive (alternative method)"""

    print("="*70)
    print("EXPORTING LABELS TO GOOGLE DRIVE")
    print("="*70)
    print()

    try:
        import ee
        import time

        # Initialize Earth Engine
        print("Initializing Google Earth Engine...")
        ee.Initialize()

        # Define Rwanda boundaries
        rwanda = ee.FeatureCollection('FAO/GAUL/2015/level0').filter(
            ee.Filter.eq('ADM0_NAME', 'Rwanda')
        )

        # Load ESA WorldCover
        worldcover = ee.Image('ESA/WorldCover/v200/2021').select('Map').clip(rwanda)

        # Get region bounds
        region = rwanda.geometry().bounds().getInfo()['coordinates']

        # Export to Google Drive
        print("Starting export to Google Drive...")
        task = ee.batch.Export.image.toDrive(
            image=worldcover,
            description='rwanda_worldcover_labels',
            scale=10,
            region=region,
            folder='earth_engine',
            maxPixels=1e13,
            fileFormat='GeoTIFF'
        )

        task.start()
        print("✓ Export task started")
        print("\nMonitoring task status...")

        while task.active():
            status = task.status()
            state = status['state']
            print(f"  Status: {state}", end='\r')

            if state == 'FAILED':
                print(f"\n❌ Task failed: {status.get('error_message', 'Unknown error')}")
                return 1

            if state == 'COMPLETED':
                break

            time.sleep(10)

        if task.status()['state'] == 'COMPLETED':
            print("\n\n✅ Export completed!")
            print("\nNext steps:")
            print("1. Open Google Drive")
            print("2. Navigate to the 'earth_engine' folder")
            print("3. Download 'rwanda_worldcover_labels.tif'")
            print("4. Move it to your project root and rename to 'labels.tif'")
            print()
            return 0
        else:
            print(f"\n❌ Export did not complete successfully")
            return 1

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1


if __name__ == "__main__":
    print("\n🌍 ESA WorldCover Label Download Tool\n")
    print("Choose download method:")
    print("1. Direct download to project (RECOMMENDED)")
    print("2. Export to Google Drive (alternative)")
    print("3. Exit")
    print()

    choice = input("Enter choice (1-3): ").strip()

    if choice == "1":
        sys.exit(download_labels())
    elif choice == "2":
        sys.exit(export_to_drive())
    else:
        print("Exiting.")
        sys.exit(0)
