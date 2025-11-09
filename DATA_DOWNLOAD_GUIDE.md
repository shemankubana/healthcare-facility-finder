# How to Get Training Data (sentinel.tif and labels.tif)

## Current Status

✅ **sentinel.tif** - Already in your project root (26MB)
❌ **labels.tif** - Missing (need to download)

## What These Files Are

- **sentinel.tif**: Sentinel-2 satellite imagery (RGB + NIR bands) of Rwanda
- **labels.tif**: ESA WorldCover 2021 land cover classification (labels for training)
  - Class 50 = Built-up areas
  - Other classes: vegetation, water, cropland, etc.

## How to Get labels.tif

### Option 1: Use the Download Script (EASIEST) ⭐

I've created a script to download it for you:

```bash
python download_labels.py
```

This will:
1. Connect to Google Earth Engine
2. Download ESA WorldCover 2021 for Rwanda
3. Save it as `labels.tif` in your project root

**Requirements:**
- Google Earth Engine account (free)
- Authenticated Earth Engine

**First-time setup:**
```bash
# Install Earth Engine
pip install earthengine-api

# Authenticate (only needed once)
python -c "import ee; ee.Authenticate()"

# Then download labels
python download_labels.py
```

### Option 2: Download from Google Drive

If you already exported the data using the notebook:

1. Open Google Drive
2. Look for folder: `earth_engine`
3. Find file: `rwanda_worldcover_labels.tif` or `rwanda_worldcover_2021.tif`
4. Download it
5. Move to project root and rename to `labels.tif`

```bash
# After downloading from Drive
mv ~/Downloads/rwanda_worldcover_*.tif ./labels.tif
```

### Option 3: Run the Notebook Export Cell

If you have the Jupyter notebook running:

1. Open `capstoneNotebook.ipynb`
2. Find Cell 20: "Alternative - Export to Google Drive"
3. Run that cell
4. Wait for export to complete (~10-30 minutes)
5. Download from Google Drive as in Option 2

### Option 4: Use Pre-downloaded Data

If you have the data from a previous run or from someone else:

```bash
# Just copy the labels file to project root
cp /path/to/your/labels.tif ./labels.tif
```

## Verify Files Are Ready

After getting the files, verify they're in the right place:

```bash
ls -lh sentinel.tif labels.tif
```

You should see:
```
-rw-r--r-- 1 user user  26M Nov 9 20:13 sentinel.tif
-rw-r--r-- 1 user user  XXM Nov 9 XX:XX labels.tif
```

## Then Train the Model

Once you have both files:

```bash
python train_model.py
```

This will:
1. Load both files
2. Extract features from satellite imagery
3. Train Random Forest classifier
4. Export model to `ml-service/models/healthcare_model.pkl`

## Troubleshooting

### "Earth Engine not authenticated"

```bash
# Run authentication
python -c "import ee; ee.Authenticate()"

# Follow the browser prompts to authenticate
# Then try downloading again
```

### "Download failed" or "Connection timeout"

Try the Google Drive export method instead:

```bash
python download_labels.py
# Choose option 2: Export to Google Drive
```

### Files are too large / taking too long

The full Rwanda dataset is large. For testing, you could:

1. Use a smaller region (edit the script to use a specific district)
2. Use lower resolution (change `scale: 10` to `scale: 30`)
3. Download overnight when you have stable internet

### Alternative: Use Smaller Test Region

If you just want to test the system, modify the download script to use Kigali only:

```python
# Instead of full Rwanda, use Kigali bounds
kigali_bounds = ee.Geometry.Rectangle([29.9, -2.0, 30.2, -1.8])
worldcover = ee.Image('ESA/WorldCover/v200/2021').select('Map').clip(kigali_bounds)
```

This will be much faster (few minutes instead of hours).

## File Size Reference

- **sentinel.tif**: ~26 MB (already have this ✅)
- **labels.tif**: ~5-50 MB depending on region
- **Full Rwanda**: Larger files, longer downloads
- **Kigali only**: Smaller files, faster downloads

## Quick Start Summary

```bash
# 1. Install requirements
pip install earthengine-api rasterio scikit-learn matplotlib seaborn

# 2. Authenticate Earth Engine (first time only)
python -c "import ee; ee.Authenticate()"

# 3. Download labels
python download_labels.py

# 4. Train model
python train_model.py

# 5. Start services and use the system!
```

## Need Help?

If you're still having issues:

1. Check your internet connection
2. Verify Google Earth Engine authentication
3. Try the Google Drive export method
4. Check the notebook for the original export code
5. Ask for help with specific error messages

Good luck! 🚀
