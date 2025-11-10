# ML Integration Guide

Complete guide for training, exporting, and deploying ML models for healthcare facility recommendations.

## Overview

The Healthcare Facility Finder uses a Random Forest classifier to identify built-up areas suitable for healthcare facilities using Sentinel-2 satellite imagery. The ML model analyzes 12 spectral features to predict whether a location is suitable for facility placement.

---

## Quick ML Setup

```bash
# 1. Download satellite data (optional - for training)
python scripts/download_data_simple.py

# 2. Train model (or use dummy)
python scripts/train_model.py

# 3. Export model
python scripts/export_model.py

# 4. Start ML service
cd ml-service
source venv/bin/activate
python -m app.main

# 5. Test ML service
curl http://localhost:5001/health
```

---

## Architecture

```
User Request → Backend → ML Service → Model Prediction
                    ↓
                Supabase DB
```

### ML Service Components

- **FastAPI Service** (port 5001) - REST API for predictions
- **Random Forest Model** - Trained classifier (200 estimators)
- **Feature Extractor** - Processes satellite imagery
- **Google Earth Engine** - Fetches Sentinel-2 imagery (optional)

---

## Training Your Own Model

### 1. Download Training Data

Two options for getting satellite imagery:

#### Option A: Simple Download (Recommended)

```bash
python scripts/download_data_simple.py
```

This downloads:
- Pre-processed Sentinel-2 composite (10m resolution)
- Land cover labels
- Saves to `sentinel.tif` and `labels.tif`

#### Option B: Tile-based Download (Advanced)

```bash
python scripts/download_data_tiles.py
```

Customizable parameters:
- Region of interest
- Date range
- Cloud cover threshold
- Tile size

See [docs/DATA_DOWNLOAD.md](DATA_DOWNLOAD.md) for details.

### 2. Train the Model

```bash
python scripts/train_model.py
```

**Training Process:**
1. Loads satellite imagery and labels
2. Extracts 12 features per patch (RGB, NDVI, Built-up Index, Brightness)
3. Balances classes (built-up vs non-built)
4. Trains Random Forest with 200 estimators
5. Evaluates on test set
6. Exports to `ml-service/models/healthcare_model.pkl`

**Expected Output:**
```
Training Random Forest model...
✅ Model trained successfully!

Accuracy: 98.93%
Precision: 0.99
Recall: 0.98
F1-Score: 0.98

Model exported to: ml-service/models/healthcare_model.pkl
File size: 24.5 MB
```

### 3. Model Features

The model uses exactly **12 features** in this order:

| Feature | Description | Source |
|---------|-------------|--------|
| R_mean | Mean of Red band | Sentinel-2 B4 |
| R_std | Std dev of Red band | Sentinel-2 B4 |
| G_mean | Mean of Green band | Sentinel-2 B3 |
| G_std | Std dev of Green band | Sentinel-2 B3 |
| B_mean | Mean of Blue band | Sentinel-2 B2 |
| B_std | Std dev of Blue band | Sentinel-2 B2 |
| NDVI_mean | Mean Vegetation Index | (NIR - Red)/(NIR + Red) |
| NDVI_std | Std dev Vegetation Index | Calculated |
| Built_mean | Mean Built-up Index | (SWIR - NIR)/(SWIR + NIR) |
| Built_std | Std dev Built-up Index | Calculated |
| Brightness_mean | Mean Brightness | Average of all bands |
| Brightness_std | Std dev Brightness | Calculated |

---

## Exporting the Model

### Using the Export Script

```bash
python scripts/export_model.py
```

**Options:**
1. **Export from trained model** - If you ran `train_model.py`
2. **Create dummy model** - For testing without training data

The script:
- Packages model + scaler + metadata
- Saves to `ml-service/models/healthcare_model.pkl`
- Verifies export by loading and testing

### Model File Format

The exported pickle file contains:

```python
{
    'model': RandomForestClassifier,
    'scaler': StandardScaler,
    'version': '1.0.0',
    'accuracy': 0.9893,
    'model_type': 'RandomForestClassifier',
    'n_estimators': 200,
    'max_depth': 10,
    'feature_names': ['R_mean', 'R_std', ...],
    'training_samples': 2247,
    'test_samples': 562,
    'trained_on': '2025-11-10 12:30:45'
}
```

---

## ML Service API

### Start the Service

```bash
cd ml-service
source venv/bin/activate
python -m app.main
```

Service runs on **http://localhost:5001**

### API Endpoints

#### Health Check
```bash
curl http://localhost:5001/health
```

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_version": "1.0.0",
  "model_accuracy": 0.9893
}
```

#### Predict from Features
```bash
curl -X POST http://localhost:5001/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": [120, 15, 110, 13, 95, 11, 0.45, 0.12, 0.67, 0.15, 108, 13]
  }'
```

Response:
```json
{
  "prediction": 1,
  "probability": 0.987,
  "confidence": "high",
  "model_version": "1.0.0"
}
```

#### Predict from Location (requires Google Earth Engine)
```bash
curl -X POST http://localhost:5001/api/predict-from-location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -1.95,
    "longitude": 30.10,
    "patch_size": 256,
    "date_start": "2025-01-01",
    "date_end": "2025-09-30"
  }'
```

---

## Integration with Backend

### Enable ML in Backend

Edit `backend/.env`:
```env
ML_ENABLED=true
ML_SERVICE_URL=http://localhost:5001
USE_ML_FOR_RECOMMENDATIONS=true
```

### Recommendation Flow

1. **User requests recommendations** via frontend
2. **Backend generates candidate locations** (20 points in district bounds)
3. **Backend calls ML service** for each location
4. **ML service:**
   - Fetches satellite imagery (if GEE configured)
   - Extracts 12 features
   - Runs Random Forest prediction
   - Returns prediction (0/1) + probability (0-1)
5. **Backend filters results** (prediction=1, probability>0.6)
6. **Backend selects top 3** by probability
7. **Backend stores in Supabase** with `recommendation_method='ml'`
8. **Frontend displays** recommendations with ML confidence scores

### Testing ML Integration

```bash
# Test via backend
curl -X POST http://localhost:8080/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "analysis": {
      "district": "Gasabo",
      "districtId": "UUID-FROM-ANALYZE-ENDPOINT",
      "avgTravel": 45,
      "target": 30,
      "bounds": {
        "minLat": -1.90,
        "maxLat": -1.80,
        "minLon": 30.05,
        "maxLon": 30.15
      }
    }
  }'
```

**Expected response:**
```json
{
  "success": true,
  "recommendation": {
    "recommendations": [
      {
        "name": "Gasabo Health Center (North)",
        "lat": -1.87,
        "lon": 30.12,
        "type": "health_center",
        "justification": "ML-identified built-up area with 98.7% confidence...",
        "ml_confidence": "high",
        "ml_probability": "0.987"
      }
    ],
    "ml_enhanced": true,
    "model_version": "1.0.0"
  },
  "method": "ml"
}
```

**Key indicators of ML working:**
- ✅ `"method": "ml"` (not "llm" or "llm-fallback")
- ✅ `"ml_enhanced": true`
- ✅ `ml_probability` and `ml_confidence` fields present
- ✅ Justification mentions "ML-identified"

---

## Google Earth Engine Setup (Optional)

For real-time satellite imagery fetching:

### 1. Get GEE Credentials

1. Create Google Cloud project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable Earth Engine API
3. Create service account
4. Download JSON key file

### 2. Configure ML Service

```bash
# Save credentials
cp your-credentials.json ml-service/credentials/gee-credentials.json

# Update .env
echo "GOOGLE_APPLICATION_CREDENTIALS=credentials/gee-credentials.json" >> ml-service/.env
```

### 3. Initialize Earth Engine

```python
import ee
ee.Initialize()
```

**Note:** GEE is optional. The ML service works without it using pre-downloaded data.

---

## Model Performance

### Metrics (on test set)

- **Accuracy:** 98.93%
- **Precision:** 0.99 (few false positives)
- **Recall:** 0.98 (catches most built-up areas)
- **F1-Score:** 0.98 (balanced performance)

### Confusion Matrix

```
                Predicted
                Non-built  Built-up
Actual Non-built     287        3
       Built-up        3       269
```

### Feature Importance

Top features for prediction:
1. Built_mean (32%)
2. NDVI_mean (28%)
3. Brightness_mean (15%)
4. R_mean (10%)
5. Other features (<5% each)

---

## Deployment

### Docker Deployment

Build and run ML service:

```bash
cd ml-service
docker build -t ml-service .
docker run -p 5001:5001 ml-service
```

### Cloud Run Deployment

```bash
gcloud run deploy ml-service \
  --source ./ml-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

Update backend `.env`:
```env
ML_SERVICE_URL=https://ml-service-xxxxx.run.app
```

---

## Troubleshooting

### "Model not loaded"

**Cause:** Model file missing or corrupt

**Solution:**
```bash
# Check file exists
ls -lh ml-service/models/healthcare_model.pkl

# If missing, export model
python scripts/export_model.py
```

### "Feature dimension mismatch"

**Cause:** Wrong number of features provided

**Solution:** Ensure exactly 12 features in correct order (see table above)

### "GEE authentication failed"

**Cause:** Google Earth Engine credentials not configured

**Solution:** Either:
1. Configure GEE credentials (see above)
2. Use pre-downloaded data (doesn't require GEE)

### Low prediction accuracy

**Cause:** Model trained on different region or outdated imagery

**Solution:**
1. Download new training data for your target region
2. Retrain model with `train_model.py`
3. Export new model

---

## Advanced Topics

### Custom Training Parameters

Edit `scripts/train_model.py`:

```python
# Adjust model complexity
rf = RandomForestClassifier(
    n_estimators=500,  # More trees = better accuracy, larger file
    max_depth=15,      # Deeper = more complex patterns
    min_samples_split=5,
    class_weight='balanced',
    random_state=42
)
```

### Add New Features

To add custom features:

1. Update feature extraction in `ml-service/app/ml_model.py`
2. Retrain model with new features
3. Update `feature_names` in model export
4. Ensure feature order is consistent

### Model Versioning

```bash
# Version models for tracking
cp ml-service/models/healthcare_model.pkl \
   ml-service/models/healthcare_model_v1.0.0.pkl
```

---

## API Documentation

Full API docs available at: **http://localhost:5001/docs** (FastAPI auto-generated)

---

## Related Documentation

- [Setup Guide](SETUP.md) - Initial setup
- [Data Download Guide](DATA_DOWNLOAD.md) - Satellite imagery
- [Architecture](ARCHITECTURE.md) - System design

**Last Updated:** 2025-11-10
