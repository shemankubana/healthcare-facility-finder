# Data Download Options

You need two files for training:
- **sentinel.tif** - Satellite imagery (Sentinel-2)
- **labels.tif** - Land cover labels (ESA WorldCover)

## Choose Your Download Method:

### Option 1: Kigali Only (FASTEST - RECOMMENDED) ⭐

**Perfect for testing and development!**

```bash
python download_data_simple.py
# Choose option 1
```

**Details:**
- ✅ Downloads both files in 2-3 minutes
- ✅ Each file ~5-10MB (well under 50MB limit)
- ✅ No extra dependencies needed
- ✅ Single download per file
- ✅ Perfect for testing your system
- 📍 Region: Kigali City (~730 km²)

**When to use:** Testing, development, demos, quick iteration

---

### Option 2: Full Rwanda with Rasterio (SLOWER)

**For production deployment with full Rwanda coverage**

```bash
# Install rasterio first (you need this anyway for training)
pip install rasterio

# Download full Rwanda
python download_rwanda_no_gdal.py
```

**Details:**
- ⏱️ Takes ~20-30 minutes
- 📦 Downloads 16 tiles per dataset (32 total)
- 🔧 Uses rasterio to merge tiles (no GDAL needed!)
- 📊 Final files ~100-200MB
- 🌍 Coverage: Full Rwanda (~26,000 km²)

**When to use:** Production deployment, full country analysis

---

### Option 3: Custom Region

**Download a specific region you care about**

```bash
python download_data_simple.py
# Choose option 2
# Enter your coordinates
```

**Details:**
- 🎯 Specify exact coordinates
- ⚡ Fast if region is small (<1000 km²)
- ✅ Single download per file
- 📍 Your custom area

**When to use:** Specific district analysis, custom projects

---

## Quick Comparison:

| Method | Time | Size | Complexity | Best For |
|--------|------|------|------------|----------|
| **Kigali** | 2-3 min | ~20MB | Simple | Testing ⭐ |
| **Full Rwanda** | 20-30 min | ~200MB | Moderate | Production |
| **Custom** | 2-10 min | Varies | Simple | Specific areas |

---

## Recommended Workflow:

### 1. Start with Kigali (Testing)

```bash
# Quick download
python download_data_simple.py  # Choose option 1

# Train model
python train_model.py

# Test your system
# Everything should work!
```

### 2. Expand to Full Rwanda (Production)

Once everything works with Kigali:

```bash
# Install rasterio (if not already)
pip install rasterio

# Download full Rwanda
python download_rwanda_no_gdal.py

# Retrain with full data
python train_model.py

# Deploy!
```

---

## Installation Requirements:

### For Kigali (Option 1):
```bash
pip install earthengine-api requests
```

### For Full Rwanda (Option 2):
```bash
pip install earthengine-api requests rasterio
```

---

## Troubleshooting:

### "Earth Engine not authenticated"
```bash
python -c "import ee; ee.Authenticate()"
# Follow browser prompts
```

### "Total request size exceeds 50MB"
- Your region is too large
- Use Option 1 (Kigali) or Option 2 (tiles)
- Or reduce your custom region size

### "rasterio not installed"
```bash
pip install rasterio
```

### Downloads are slow
- Normal! Earth Engine processes images on-demand
- Kigali: 2-3 minutes is expected
- Full Rwanda: 20-30 minutes is expected
- Be patient and let it complete

---

## Files Summary:

| Script | Purpose | Dependencies |
|--------|---------|--------------|
| `download_data_simple.py` | Kigali or custom (fast) | earthengine-api, requests |
| `download_rwanda_no_gdal.py` | Full Rwanda (tiles) | earthengine-api, requests, rasterio |
| `download_data_tiles.py` | Full Rwanda (GDAL) | earthengine-api, requests, GDAL ❌ |
| `download_labels.py` | Old script (partial) | earthengine-api, requests |

**Recommended:** Use `download_data_simple.py` for Kigali or `download_rwanda_no_gdal.py` for full Rwanda

---

## What Each File Contains:

### sentinel.tif
- Sentinel-2 satellite imagery
- Bands: B4 (Red), B3 (Green), B2 (Blue), B8 (NIR)
- 10m resolution
- Cloud-free median composite (Jan-Sep 2025)

### labels.tif
- ESA WorldCover 2021 land cover classification
- Class 50 = Built-up areas (what we want to predict)
- Other classes: vegetation, water, cropland, etc.
- 10m resolution

---

## Quick Start (Copy-Paste):

```bash
# 1. Authenticate Earth Engine (first time only)
python -c "import ee; ee.Authenticate()"

# 2. Download Kigali data (fast)
python download_data_simple.py
# Choose option 1

# 3. Train model
python train_model.py

# Done! 🎉
```

---

Need help? Check the error message and troubleshooting section above!
