# ML Integration Plan

## Overview
This document outlines the plan for integrating the Random Forest ML model from `capstoneNotebook.ipynb` into the production backend.

---

## Current State (As of 2025-11-07)

### What Exists
- ✅ Trained Random Forest Classifier (200 estimators) in Jupyter notebook
- ✅ Model serialization with pickle (model + StandardScaler)
- ✅ Feature extraction pipeline for Sentinel-2 satellite imagery
- ✅ Accessibility analysis algorithms
- ✅ OpenStreetMap integration for facility data

### What's Missing
- ❌ Production API endpoints for ML predictions
- ❌ Google Earth Engine (GEE) credentials for production
- ❌ Python microservice for model inference
- ❌ Model versioning and monitoring
- ❌ Satellite imagery cache/preprocessing pipeline

---

## ML Model Details

### Model Type
**Random Forest Classifier** (Binary Classification)
- **Purpose:** Detect healthcare facilities and built-up areas from satellite imagery
- **Output:** Class 0 (non-built) or Class 1 (built-up/healthcare)
- **Accuracy:** ~99% on test set (note: class imbalanced)

### Input Features (12 dimensions)
```python
[
  R_mean, R_std,           # Red band statistics
  G_mean, G_std,           # Green band statistics
  B_mean, B_std,           # Blue band statistics
  NDVI_mean, NDVI_std,     # Vegetation index
  Built_mean, Built_std,   # Built-up index
  Brightness_mean, Brightness_std  # Overall brightness
]
```

### Dependencies
- **Satellite Data:** Sentinel-2 via Google Earth Engine
- **Ground Truth:** ESA WorldCover 2021
- **Facility Data:** OpenStreetMap Overpass API
- **ML Libraries:** scikit-learn, rasterio, geopandas
- **Preprocessing:** StandardScaler (must be loaded with model)

---

## Proposed Architecture

### Option 1: Python Microservice (Recommended)

```
┌─────────────────┐
│  Express.js API │
│  (Port 8080)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ Python ML API   │◄─────┤ Google Earth     │
│ (Flask/FastAPI) │      │ Engine API       │
│ Port 5001       │      └──────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PostgreSQL +    │
│ PostGIS         │
└─────────────────┘
```

**Pros:**
- Native Python ML libraries (no conversion needed)
- Direct GEE API access
- Easy to maintain and update model
- Can handle complex preprocessing

**Cons:**
- Additional service to deploy
- Inter-process communication overhead

### Option 2: Convert to ONNX + Node.js Inference

```
┌─────────────────────────┐
│  Express.js API         │
│  + ONNX Runtime         │
│  (Port 8080)            │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ GEE Python Worker       │
│ (Image fetching only)   │
└─────────────────────────┘
```

**Pros:**
- Single Node.js process
- Faster inference (optimized)
- No Python runtime needed in production

**Cons:**
- Model conversion complexity
- Limited to ONNX-supported models
- Still needs Python for GEE API

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. ✅ Create Python microservice scaffold (Flask/FastAPI)
2. ✅ Export model + scaler from notebook to `/models` directory
3. ✅ Implement `/predict` endpoint
4. ✅ Test prediction with sample data

### Phase 2: Satellite Integration (Week 3-4)
1. ❌ Set up GEE API credentials
2. ❌ Implement image fetching from Sentinel-2
3. ❌ Add cloud masking and preprocessing
4. ❌ Create caching layer for processed imagery

### Phase 3: Production Readiness (Week 5-6)
1. ❌ Add model versioning
2. ❌ Implement prediction monitoring
3. ❌ Add batch prediction endpoint
4. ❌ Create retraining pipeline
5. ❌ Add error handling and fallbacks

### Phase 4: Integration (Week 7-8)
1. ❌ Connect Express API to Python service
2. ❌ Update district analysis to include ML predictions
3. ❌ Add ML-based recommendations
4. ❌ Update frontend to show ML insights

---

## API Endpoints Design

### 1. Predict Healthcare Facility
```http
POST /api/ml/predict
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": -1.9403,
  "longitude": 29.8739,
  "patch_size": 256
}

Response:
{
  "prediction": 1,
  "probability": 0.87,
  "confidence": "high",
  "features": {
    "ndvi_mean": 0.45,
    "built_up_index": 0.67,
    "brightness": 128.5
  },
  "timestamp": "2025-11-07T12:00:00Z"
}
```

### 2. Batch Analysis for District
```http
POST /api/ml/analyze-district
Authorization: Bearer <token>
Content-Type: application/json

{
  "district_id": "uuid",
  "grid_resolution": 1000,  // meters
  "date_range": ["2025-01-01", "2025-09-30"]
}

Response:
{
  "district": "Kayonza",
  "total_predictions": 156,
  "high_probability_areas": [
    {
      "latitude": -1.9403,
      "longitude": 29.8739,
      "probability": 0.92,
      "recommendation": "High priority for new facility"
    }
  ],
  "heatmap_url": "https://...",
  "analysis_date": "2025-11-07"
}
```

### 3. Model Info
```http
GET /api/ml/model/info

Response:
{
  "model_type": "RandomForestClassifier",
  "version": "1.0.0",
  "last_trained": "2025-11-01",
  "accuracy": 0.99,
  "input_features": 12,
  "satellite_source": "Sentinel-2",
  "status": "active"
}
```

---

## Environment Variables Required

```bash
# Python ML Service
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gee-credentials.json
OPENSTREETMAP_API_URL=http://overpass-api.de/api/interpreter
MODEL_PATH=/models/healthcare_model.pkl
SENTINEL_BANDS=B4,B3,B2,B8,B11,B12
PATCH_SIZE=256
ML_SERVICE_PORT=5001

# Express Backend
ML_SERVICE_URL=http://localhost:5001
ML_ENABLED=false  # Set to true when ML service is ready
```

---

## Data Requirements

### Storage Needs
- **Model Files:** ~50 MB (RF model + scaler)
- **Satellite Cache:** ~10-100 GB (depending on coverage)
- **Processed Features:** ~1 GB per district

### Compute Requirements
- **Prediction:** ~50ms per 256x256 patch
- **Feature Extraction:** ~200ms per patch
- **Satellite Fetch:** ~2-5 seconds per patch (GEE API)
- **District Analysis:** ~5-30 minutes (depending on grid size)

---

## Security Considerations

1. **GEE Credentials:** Store in secure vault, never commit to git
2. **API Rate Limiting:** Limit ML prediction requests (expensive)
3. **Authentication:** All ML endpoints require admin/researcher role
4. **Data Privacy:** Satellite imagery should not contain PII
5. **Model Access:** Restrict model file access to service account

---

## Testing Strategy

### Unit Tests
- Feature extraction accuracy
- Model prediction consistency
- Scaler transformation correctness

### Integration Tests
- GEE API connectivity
- Express → Python communication
- Database storage of predictions

### End-to-End Tests
- District analysis workflow
- Recommendation generation with ML
- Frontend display of ML results

---

## Monitoring & Alerting

### Metrics to Track
- Prediction latency (p50, p95, p99)
- GEE API success rate
- Model prediction distribution
- Cache hit rate
- Error rate by endpoint

### Alerts
- GEE API failures
- Model prediction anomalies
- Service downtime
- High latency (>5s)

---

## Fallback Strategy

When ML service is unavailable:
1. Use existing LLM-based recommendations (Ollama)
2. Use algorithmic facility placement (population density)
3. Return cached predictions (if available)
4. Notify admins of degraded mode

---

## Cost Estimates

### Development
- **Developer Time:** 8 weeks (1 developer)
- **GEE API Setup:** 1-2 days
- **Testing:** 1 week

### Operational (Monthly)
- **GEE API:** $0-50 (free tier: 15 million pixels/day)
- **Compute (ML Service):** $20-100 (AWS t3.medium)
- **Storage:** $10-30 (satellite imagery cache)
- **Total:** ~$30-180/month

---

## Next Steps

1. **Immediate (Now):**
   - ✅ Document ML integration plan
   - ✅ Move notebook to `/ml` directory
   - ✅ Export trained model to `/models` directory

2. **Short-term (Next Sprint):**
   - Create Python ML microservice
   - Set up GEE credentials
   - Implement basic `/predict` endpoint
   - Add feature flag in backend

3. **Medium-term (Next Month):**
   - Integrate with Express API
   - Add caching layer
   - Implement district analysis
   - Update frontend

4. **Long-term (Next Quarter):**
   - Model monitoring
   - Retraining pipeline
   - Performance optimization
   - Scale to full Rwanda coverage

---

## References

- **Notebook:** `/home/user/healthcare-facility-finder/capstoneNotebook.ipynb`
- **Model Analysis:** See ML notebook analysis report
- **Sentinel-2 Docs:** https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR
- **ESA WorldCover:** https://esa-worldcover.org/en
- **OSM Overpass API:** https://wiki.openstreetmap.org/wiki/Overpass_API

---

*Document Version: 1.0*
*Last Updated: 2025-11-07*
*Author: System Analysis*
