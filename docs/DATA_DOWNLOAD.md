# Satellite Data Download Guide

Guide for downloading satellite imagery and training data for the ML model.

## Overview

The ML model requires:
- **Sentinel-2 imagery** (RGB + NIR bands) - Satellite photos
- **Land cover labels** (ESA WorldCover) - Training labels

---

## Quick Start

```bash
# 1. Install Earth Engine
pip install earthengine-api

# 2. Authenticate (first time only)
python -c "import ee; ee.Authenticate()"

# 3. Download data
python scripts/download_data_simple.py

# 4. Verify files
ls -lh sentinel.tif labels.tif
```

---

## Download Methods

### Method 1: Simple Download (Recommended)

```bash
python scripts/download_data_simple.py
```

**Downloads:**
- Sentinel-2 composite (10m resolution)
- ESA WorldCover 2021 labels
- Saves to `sentinel.tif` and `labels.tif`

**Requirements:**
- Google Earth Engine account (free)
- Authenticated Earth Engine session

### Method 2: Tile-based Download (Advanced)

For large regions or custom settings:

```bash
python scripts/download_data_tiles.py
```

**Features:**
- Customizable region of interest
- Date range selection
- Cloud cover filtering
- Parallel tile downloads

**Parameters:**
```python
# Edit in script
REGION = 'Rwanda'  # or custom bounds
DATE_START = '2023-01-01'
DATE_END = '2023-12-31'
CLOUD_COVER_MAX = 20
TILE_SIZE = 256
```

### Method 3: Download Labels Only

If you already have Sentinel-2 imagery:

```bash
python scripts/download_labels.py
```

Downloads only the ESA WorldCover land cover classification.

---

## Google Earth Engine Setup

### Create Account

1. Go to [earthengine.google.com](https://earthengine.google.com)
2. Click "Sign Up"
3. Register with your Google account
4. Wait for approval (~24 hours, usually instant)

### Authenticate

```bash
# Run authentication
python -c "import ee; ee.Authenticate()"

# Follow browser prompts:
# 1. Select Google account
# 2. Allow Earth Engine access
# 3. Copy auth code
# 4. Paste in terminal
```

### Verify Setup

```python
import ee
ee.Initialize()
print("✅ Earth Engine authenticated")
```

---

## Data Specifications

### Sentinel-2

- **Bands:** B2 (Blue), B3 (Green), B4 (Red), B8 (NIR)
- **Resolution:** 10 meters
- **Coverage:** Rwanda (or custom region)
- **Composite:** Median composite (reduces clouds)
- **File size:** ~10-50 MB

### ESA WorldCover

- **Product:** ESA WorldCover v200 (2021)
- **Resolution:** 10 meters
- **Classes:**
  - 50: Built-up areas
  - 10: Trees
  - 20: Shrubland
  - 30: Grassland
  - 40: Cropland
  - 60: Bare/sparse vegetation
  - 70: Snow/ice
  - 80: Water
  - 90: Herbaceous wetland
  - 95: Mangroves
  - 100: Moss and lichen
- **File size:** ~5-30 MB

---

## Custom Region Download

### Define Region

```python
import ee

# Option 1: Bounding box
region = ee.Geometry.Rectangle([
    29.0,  # min longitude
    -3.0,  # min latitude
    31.0,  # max longitude
    -1.0   # max latitude
])

# Option 2: Specific district
region = ee.Feature(
    ee.FeatureCollection("FAO/GAUL/2015/level2")
    .filter(ee.Filter.eq('ADM2_NAME', 'Kigali'))
).geometry()

# Option 3: Draw on map (Earth Engine Code Editor)
```

### Download Custom Region

```python
# In scripts/download_data_simple.py
# Modify the BOUNDS variable:
BOUNDS = ee.Geometry.Rectangle([29.9, -2.0, 30.2, -1.8])  # Kigali only
```

---

## Troubleshooting

### "Earth Engine not authenticated"

**Solution:**
```bash
python -c "import ee; ee.Authenticate()"
# Follow browser prompts
```

### "User has not initialized Earth Engine"

**Solution:**
```python
import ee
ee.Initialize()
```

### "Download failed" / "Connection timeout"

**Causes:**
- Unstable internet
- Large file size
- Earth Engine quota exceeded

**Solutions:**
1. Use smaller region
2. Try again later
3. Export to Google Drive instead:

```python
# In download script, add:
task = ee.batch.Export.image.toDrive(
    image=image,
    description='sentinel_export',
    folder='earth_engine',
    scale=10
)
task.start()
```

### Files are too large

**For testing only:**
- Reduce resolution: `scale=30` instead of `scale=10`
- Use smaller region: Kigali only
- Use single district

**For production:**
- Download overnight
- Use stable network
- Consider cloud storage

### "Memory limit exceeded"

**Solution:**
Reduce image size:
```python
# Lower resolution
scale = 30  # instead of 10

# Smaller region
bounds = ee.Geometry.Rectangle([30.0, -2.0, 30.1, -1.9])
```

---

## File Verification

### Check Files Exist

```bash
ls -lh sentinel.tif labels.tif
```

Expected output:
```
-rw-r--r-- 1 user user  26M Nov 10 12:00 sentinel.tif
-rw-r--r-- 1 user user  15M Nov 10 12:05 labels.tif
```

### Verify with Python

```python
import rasterio

# Check Sentinel-2
with rasterio.open('sentinel.tif') as src:
    print(f"Bands: {src.count}")  # Should be 4 (R,G,B,NIR)
    print(f"Shape: {src.shape}")
    print(f"Bounds: {src.bounds}")

# Check labels
with rasterio.open('labels.tif') as src:
    print(f"Bands: {src.count}")  # Should be 1
    print(f"Classes: {np.unique(src.read(1))}")  # Should include 50 (built-up)
```

---

## Data Processing

After download, the training script:

1. **Loads images** with rasterio
2. **Extracts patches** (256x256 pixels)
3. **Calculates features:**
   - RGB statistics (mean, std)
   - NDVI (vegetation index)
   - Built-up index
   - Brightness
4. **Labels patches** as built-up (1) or non-built (0)
5. **Trains model** on extracted features

---

## Alternative Data Sources

### If Earth Engine fails:

1. **Sentinel Hub** - sentinelhub.com (requires API key)
2. **USGS Earth Explorer** - earthexplorer.usgs.gov (manual download)
3. **Microsoft Planetary Computer** - planetarycomputer.microsoft.com
4. **Pre-downloaded datasets** - Ask team members

---

## File Size Reference

| Region | Sentinel-2 | Labels | Total |
|--------|------------|--------|-------|
| Kigali City | ~10 MB | ~5 MB | ~15 MB |
| Single District | ~15 MB | ~7 MB | ~22 MB |
| Full Rwanda | ~50 MB | ~30 MB | ~80 MB |
| East Africa | ~500 MB | ~300 MB | ~800 MB |

**Tip:** Start with small region for testing, then scale up.

---

## Production Considerations

### Storage

- Store raw data in cloud storage (S3, GCS)
- Use versioned buckets
- Automate periodic updates

### Automation

```bash
# Cron job for monthly updates
0 0 1 * * python scripts/download_data_simple.py
```

### Monitoring

- Track download success/failure
- Monitor quota usage
- Alert on errors

---

## Related Documentation

- [ML Guide](ML_GUIDE.md) - Training the model
- [Setup Guide](SETUP.md) - Initial setup
- [Architecture](ARCHITECTURE.md) - System design

**Last Updated:** 2025-11-10
