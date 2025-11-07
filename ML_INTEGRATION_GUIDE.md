# ML Integration Quick Start Guide

This guide will help you set up and use the ML prediction service with the Healthcare Facility Finder application.

## Overview

The ML service provides predictions for healthcare facility detection from satellite imagery using a trained Random Forest model.

**Architecture:**
```
Frontend (React) → Express Backend (Port 8080) → ML Service (FastAPI, Port 5001)
                                                      ↓
                                              Google Earth Engine (Satellite Data)
```

---

## Prerequisites

- Trained ML model exported from `capstoneNotebook.ipynb`
- Python 3.9+ installed
- (Optional) Google Earth Engine account for satellite imagery

---

## Quick Start (3 Steps)

### Step 1: Export ML Model

From your Jupyter notebook:

```python
import pickle

# After training your model
model_data = {
    'model': model,  # Your trained RandomForestClassifier
    'scaler': scaler,  # Your fitted StandardScaler
    'version': '1.0.0',
    'accuracy': 0.99
}

with open('../ml-service/models/healthcare_model.pkl', 'wb') as f:
    pickle.dump(model_data, f)

print("✅ Model exported!")
```

### Step 2: Start ML Service

```bash
# Option A: Direct Python
cd ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5001

# Option B: Docker
docker-compose up ml-service
```

### Step 3: Enable in Backend

Update `backend/.env`:
```bash
ML_ENABLED=true
ML_SERVICE_URL=http://localhost:5001
```

Restart backend:
```bash
cd backend
npm start
```

**Done!** ML predictions are now available via `/api/ml/*` endpoints.

---

## API Usage

### Check ML Service Status

```bash
curl http://localhost:8080/api/ml/health
```

Response:
```json
{
  "enabled": true,
  "available": true,
  "gee_available": false,
  "status": "healthy"
}
```

### Get Model Information

```bash
curl http://localhost:8080/api/ml/model/info
```

Response:
```json
{
  "model_type": "RandomForestClassifier",
  "version": "1.0.0",
  "accuracy": 0.99,
  "n_estimators": 200,
  "max_depth": 10,
  "input_features": 12,
  "feature_names": ["R_mean", "R_std", ...],
  "status": "active"
}
```

### Make Prediction (from features)

```bash
curl -X POST http://localhost:8080/api/ml/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": [
      120.5, 15.2,  # R_mean, R_std
      110.3, 12.8,  # G_mean, G_std
      95.7, 10.5,   # B_mean, B_std
      0.45, 0.12,   # NDVI_mean, NDVI_std
      0.67, 0.15,   # Built_mean, Built_std
      108.8, 13.2   # Brightness_mean, Brightness_std
    ]
  }'
```

Response:
```json
{
  "prediction": 1,
  "probability": 0.87,
  "confidence": "high",
  "timestamp": "2025-11-07T12:00:00Z"
}
```

### Predict from Location (requires GEE)

```bash
curl -X POST http://localhost:8080/api/ml/predict-location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -1.9403,
    "longitude": 29.8739,
    "patch_size": 256
  }'
```

---

## Google Earth Engine Setup (Optional)

To enable satellite imagery fetching:

### 1. Create GEE Account
Visit: https://earthengine.google.com/signup/

### 2. Authenticate

**Option A: User Authentication**
```bash
cd ml-service
source venv/bin/activate
earthengine authenticate
```

**Option B: Service Account (Production)**
1. Create service account in Google Cloud Console
2. Enable Earth Engine API
3. Download JSON credentials
4. Save to `ml-service/credentials/gee-credentials.json`
5. Set environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=ml-service/credentials/gee-credentials.json
```

### 3. Test GEE Connection

```python
import ee

ee.Authenticate()
ee.Initialize()

# Test query
point = ee.Geometry.Point([29.8739, -1.9403])
image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
    .filterBounds(point) \
    .first()

print("✅ GEE connection working!")
```

---

## Integration with District Analysis

Update `backend/routes/analyze.js` to include ML predictions:

```javascript
// After standard analysis
if (process.env.ML_ENABLED === 'true') {
  try {
    // Get ML prediction for district center
    const mlResponse = await fetch(`${ML_SERVICE_URL}/api/predict-from-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: districtCenterLat,
        longitude: districtCenterLon
      })
    });

    const mlData = await mlResponse.json();
    analysis.ml_prediction = mlData;
  } catch (error) {
    console.warn('ML prediction failed:', error);
    // Continue without ML data
  }
}
```

---

## Frontend Integration

### Check ML Availability

```javascript
// In React component
const [mlAvailable, setMlAvailable] = useState(false);

useEffect(() => {
  fetch('http://localhost:8080/api/ml/health')
    .then(res => res.json())
    .then(data => setMlAvailable(data.available))
    .catch(() => setMlAvailable(false));
}, []);
```

### Display ML Predictions

```jsx
{mlAvailable && analysis.ml_prediction && (
  <div className="ml-prediction">
    <h3>ML Analysis</h3>
    <p>Built-up Detection: {analysis.ml_prediction.prediction === 1 ? 'Yes' : 'No'}</p>
    <p>Confidence: {(analysis.ml_prediction.probability * 100).toFixed(1)}%</p>
    <ConfidenceBadge level={analysis.ml_prediction.confidence} />
  </div>
)}
```

---

## Docker Deployment

### Full Stack with ML

```bash
# 1. Ensure model file exists
ls ml-service/models/healthcare_model.pkl

# 2. Create .env file
cat > .env << EOF
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
ML_ENABLED=true
EOF

# 3. Start all services
docker-compose up -d

# 4. Check ML service health
docker-compose logs ml-service
curl http://localhost:5001/health

# 5. Test end-to-end
curl http://localhost:8080/api/ml/health
```

### Logs and Debugging

```bash
# ML service logs
docker-compose logs -f ml-service

# All services
docker-compose logs -f

# Restart ML service
docker-compose restart ml-service
```

---

## Performance Tuning

### Reduce Latency

1. **Batch predictions:**
```javascript
// Instead of multiple single predictions
for (let i = 0; i < locations.length; i++) {
  await predict(locations[i]);  // SLOW
}

// Use batch endpoint
await predictBatch(locations);  // FAST
```

2. **Cache results:**
```javascript
const cache = new Map();

async function predictWithCache(features) {
  const key = JSON.stringify(features);
  if (cache.has(key)) return cache.get(key);

  const result = await predict(features);
  cache.set(key, result);
  return result;
}
```

3. **Adjust uvicorn workers:**
```bash
# In production
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 5001
```

### Reduce Memory

1. **Model optimization:**
```python
# Reduce tree depth
model = RandomForestClassifier(
    n_estimators=100,  # Instead of 200
    max_depth=8,        # Instead of 10
    max_features='sqrt'
)
```

2. **Use joblib compression:**
```python
import joblib
joblib.dump(model_data, 'model.pkl', compress=3)
```

---

## Monitoring

### Health Checks

```bash
# Check every 30 seconds
watch -n 30 'curl -s http://localhost:5001/health | jq'
```

### Metrics to Track

- Prediction latency (p50, p95, p99)
- GEE API success rate
- Model prediction distribution
- Error rates

### Logging

Update `ml-service/.env`:
```bash
LOG_LEVEL=DEBUG  # For detailed logs
# or
LOG_LEVEL=INFO   # For production
```

View logs:
```bash
# Docker
docker-compose logs -f ml-service

# Direct
tail -f ml-service/logs/app.log
```

---

## Troubleshooting

### "Model not loaded"

**Problem:** ML service can't find model file

**Solution:**
```bash
# Check model exists
ls ml-service/models/healthcare_model.pkl

# Check permissions
chmod 644 ml-service/models/healthcare_model.pkl

# Check Docker volume mount
docker-compose exec ml-service ls -la /app/models/
```

### "GEE authentication failed"

**Problem:** Can't connect to Google Earth Engine

**Solution:**
```bash
# Re-authenticate
cd ml-service
source venv/bin/activate
earthengine authenticate

# Or check service account credentials
echo $GOOGLE_APPLICATION_CREDENTIALS
cat $GOOGLE_APPLICATION_CREDENTIALS  # Verify JSON is valid
```

### "503 Service Unavailable"

**Problem:** ML service not responding

**Solution:**
```bash
# Check if service is running
curl http://localhost:5001/health

# Restart service
docker-compose restart ml-service
# or
cd ml-service && uvicorn app.main:app --reload --port 5001

# Check logs
docker-compose logs ml-service
```

### High memory usage

**Problem:** ML service using too much RAM

**Solution:**
1. Reduce model complexity (see Performance Tuning)
2. Limit concurrent requests
3. Increase swap space
4. Use smaller batch sizes

### Predictions seem wrong

**Problem:** Model giving unexpected results

**Solution:**
1. Verify feature order is correct
2. Check scaler is applied
3. Validate input features are in correct range
4. Test with known good samples
5. Check model version matches training

---

## Testing

### Unit Tests

```bash
cd ml-service
pytest tests/ -v
```

### Integration Tests

```bash
# Test full pipeline
curl -X POST http://localhost:8080/api/ml/predict-location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -1.9403,
    "longitude": 29.8739
  }' | jq

# Expected: Valid prediction response
```

### Load Testing

```bash
# Install hey
go install github.com/rakyll/hey@latest

# Test 100 requests
hey -n 100 -c 10 \
  -m POST \
  -H "Content-Type: application/json" \
  -d '{"features":[120,15,110,13,95,11,0.45,0.12,0.67,0.15,108,13]}' \
  http://localhost:5001/api/predict
```

---

## Production Checklist

Before deploying to production:

- [ ] Model file is optimized and tested
- [ ] GEE credentials configured (if needed)
- [ ] Environment variables set correctly
- [ ] Docker health checks working
- [ ] Monitoring/alerting configured
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Logs being collected
- [ ] Backup strategy for model files
- [ ] Model versioning implemented
- [ ] Load testing completed
- [ ] Security review done

---

## Next Steps

1. **Train better model:** See `capstoneNotebook.ipynb`
2. **Add more features:** Update `feature_extractor.py`
3. **Optimize performance:** See Performance Tuning section
4. **Set up monitoring:** Use Prometheus + Grafana
5. **Implement A/B testing:** Version models and compare

---

## Resources

- **ML Service README:** `ml-service/README.md`
- **Integration Plan:** `ML_INTEGRATION_PLAN.md`
- **Training Notebook:** `capstoneNotebook.ipynb`
- **API Documentation:** http://localhost:5001/docs (when running)
- **GEE Documentation:** https://developers.google.com/earth-engine

---

**Need help?** Check the troubleshooting section or create an issue on GitHub.
