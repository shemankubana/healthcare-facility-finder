# Healthcare Facility Finder - ML Service

FastAPI microservice for machine learning predictions on satellite imagery to detect healthcare facilities and built-up areas.

## Features

- **Random Forest Classifier** trained on Sentinel-2 satellite imagery
- **Feature Extraction** from satellite imagery via Google Earth Engine
- **REST API** for predictions and model information
- **Batch Prediction** support for efficient processing
- **Health Checks** and monitoring endpoints

## Architecture

```
┌─────────────────┐
│  Express.js API │  (Port 8080)
│  (Main Backend) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ ML Service      │◄─────┤ Google Earth     │
│ (FastAPI)       │      │ Engine API       │
│ Port 5001       │      └──────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Trained Model   │
│ (Random Forest) │
└─────────────────┘
```

## Installation

### Prerequisites

- Python 3.9+
- pip or conda
- (Optional) Google Earth Engine account for satellite imagery

### Setup

1. **Create virtual environment:**
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up Google Earth Engine (optional but recommended):**
```bash
# Authenticate with your Google account
earthengine authenticate

# Or use service account credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

5. **Add trained model:**
Place your trained model file at:
```
ml-service/models/healthcare_model.pkl
```

The model file should be a pickle file containing:
```python
{
    'model': trained_random_forest_model,
    'scaler': fitted_standard_scaler,
    'version': '1.0.0',
    'accuracy': 0.99  # optional
}
```

## Usage

### Start the service

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --port 5001

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 5001 --workers 4
```

### API Endpoints

#### Health Check
```bash
GET /health

Response:
{
  "status": "healthy",
  "model_loaded": true,
  "gee_available": true,
  "timestamp": "2025-11-07T12:00:00Z"
}
```

#### Model Information
```bash
GET /api/model/info

Response:
{
  "model_type": "RandomForestClassifier",
  "version": "1.0.0",
  "accuracy": 0.99,
  "n_estimators": 200,
  "max_depth": 10,
  "input_features": 12,
  "feature_names": [...],
  "last_loaded": "2025-11-07T12:00:00Z",
  "status": "active"
}
```

#### Predict from Features
```bash
POST /api/predict
Content-Type: application/json

{
  "features": [
    120.5, 15.2,  # R_mean, R_std
    110.3, 12.8,  # G_mean, G_std
    95.7, 10.5,   # B_mean, B_std
    0.45, 0.12,   # NDVI_mean, NDVI_std
    0.67, 0.15,   # Built_mean, Built_std
    108.8, 13.2   # Brightness_mean, Brightness_std
  ]
}

Response:
{
  "prediction": 1,
  "probability": 0.87,
  "confidence": "high",
  "features_used": {...},
  "timestamp": "2025-11-07T12:00:00Z"
}
```

#### Predict from Location (requires GEE)
```bash
POST /api/predict-from-location
Content-Type: application/json

{
  "latitude": -1.9403,
  "longitude": 29.8739,
  "patch_size": 256,
  "date_start": "2025-01-01",
  "date_end": "2025-09-30"
}

Response:
{
  "prediction": 1,
  "probability": 0.92,
  "confidence": "high",
  "timestamp": "2025-11-07T12:00:00Z"
}
```

#### Batch Prediction
```bash
POST /api/predict-batch
Content-Type: application/json

{
  "requests": [
    {"features": [...]},
    {"features": [...]},
    ...
  ]
}

Response:
{
  "total_predictions": 50,
  "results": [
    {
      "index": 0,
      "prediction": 1,
      "probability": 0.85,
      "confidence": "high"
    },
    ...
  ],
  "timestamp": "2025-11-07T12:00:00Z"
}
```

## Model Details

### Input Features (12 dimensions)

The model expects features extracted from Sentinel-2 satellite imagery:

1. **R_mean**: Mean of Red band (B4)
2. **R_std**: Standard deviation of Red band
3. **G_mean**: Mean of Green band (B3)
4. **G_std**: Standard deviation of Green band
5. **B_mean**: Mean of Blue band (B2)
6. **B_std**: Standard deviation of Blue band
7. **NDVI_mean**: Mean Normalized Difference Vegetation Index
8. **NDVI_std**: Standard deviation of NDVI
9. **Built_mean**: Mean Built-up Index
10. **Built_std**: Standard deviation of Built-up Index
11. **Brightness_mean**: Mean brightness
12. **Brightness_std**: Standard deviation of brightness

### Indices Calculation

- **NDVI** = (NIR - Red) / (NIR + Red + 0.0001)
- **Built-up Index** = (Red + Green) / 2 - NIR
- **Brightness** = (Red + Green + Blue) / 3

### Output

- **Prediction**: Binary classification (0 = non-built, 1 = built-up/healthcare)
- **Probability**: Confidence score (0.0 to 1.0)
- **Confidence**: Qualitative assessment (low/medium/high)

## Testing

```bash
# Run unit tests
pytest tests/

# Test API endpoints
pytest tests/test_api.py

# Manual testing with curl
curl -X GET http://localhost:5001/health
curl -X POST http://localhost:5001/api/predict \
  -H "Content-Type: application/json" \
  -d '{"features": [...]}'
```

## Docker Deployment

```bash
# Build image
docker build -t healthcare-ml-service .

# Run container
docker run -d \
  -p 5001:5001 \
  -v $(pwd)/models:/app/models \
  -e MODEL_PATH=models/healthcare_model.pkl \
  --name ml-service \
  healthcare-ml-service
```

## Integration with Express Backend

The Express backend (port 8080) proxies ML requests to this service:

```javascript
// Express routes
app.post('/api/ml/predict', async (req, res) => {
  const response = await fetch('http://ml-service:5001/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body)
  });
  const data = await response.json();
  res.json(data);
});
```

## Performance

- **Prediction Latency**: ~50ms per sample (features provided)
- **Feature Extraction**: ~2-5 seconds (with GEE API call)
- **Batch Processing**: ~100 predictions per second
- **Memory Usage**: ~500MB (model + dependencies)

## Troubleshooting

### Model not loading
- Check that `healthcare_model.pkl` exists in `models/` directory
- Verify model file contains both 'model' and 'scaler' keys
- Check file permissions

### GEE authentication errors
- Run `earthengine authenticate` to authorize
- Or set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Verify credentials have Earth Engine API access

### CORS errors
- Update `ALLOWED_ORIGINS` in `.env`
- Check that Express backend is whitelisted

### High memory usage
- Reduce `max_depth` of Random Forest
- Use fewer `n_estimators`
- Enable model quantization

## Development

### Code Structure

```
ml-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── model_loader.py      # Model loading and prediction
│   └── feature_extractor.py # Satellite imagery processing
├── models/
│   └── healthcare_model.pkl # Trained model (not in git)
├── tests/
│   ├── test_api.py
│   ├── test_model_loader.py
│   └── test_feature_extractor.py
├── requirements.txt
├── .env.example
├── Dockerfile
└── README.md
```

### Adding New Features

1. Update `feature_extractor.py` to calculate new indices
2. Retrain model with new features in Jupyter notebook
3. Update feature count in `model_loader.py`
4. Update API documentation

## License

Part of the Healthcare Facility Finder project.

## Support

For issues and questions, see the main project README or create an issue on GitHub.
