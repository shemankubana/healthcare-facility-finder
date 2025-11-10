# ML Service Integration Setup Guide

This guide explains how to run the healthcare facility finder with the ML recommendation service integrated.

## Architecture Overview

The application consists of three services that work together:

```
Frontend (React, Port 3000)
    ↓
Backend (Node.js/Express, Port 8080)
    ↓
ML Service (Python/FastAPI, Port 5001)
```

## Prerequisites

1. **Node.js** (v16+) and npm
2. **Python** (v3.8+) and pip
3. **Supabase** account with credentials
4. **Google Earth Engine** credentials (optional, for satellite imagery)

## Configuration

### 1. Environment Files

Three `.env` files have been created:

#### Frontend (`frontend-react/frontend/.env`)
- `REACT_APP_API_URL=http://localhost:8080` - Points to the backend
- Update Supabase credentials (get from your Supabase dashboard)

#### Backend (`backend/.env`)
- `ML_ENABLED=true` - **Important:** Enables ML recommendations
- `ML_SERVICE_URL=http://localhost:5001` - ML service endpoint
- Update Supabase credentials
- `PORT=8080` - Backend server port

#### ML Service (`ml-service/.env`)
- `ML_SERVICE_PORT=5001` - ML service port
- `MODEL_PATH=models/healthcare_model.pkl` - Path to trained model
- Google Earth Engine credentials (optional)

### 2. Update Supabase Credentials

Replace the placeholder values in all three `.env` files:

```bash
# Get these from your Supabase project dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Running the Services

### Terminal 1: ML Service (Port 5001)

```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m app.main
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:5001
INFO:     Model loaded successfully
```

### Terminal 2: Backend (Port 8080)

```bash
cd backend
npm install
npm start
```

**Expected output:**
```
✅ Server running on port 8080
✓ ML service available
```

### Terminal 3: Frontend (Port 3000)

```bash
cd frontend-react/frontend
npm install
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view the app in the browser.
  Local: http://localhost:3000
```

## Testing the ML Integration

### 1. Health Check

Test that all services are running:

```bash
# ML Service health
curl http://localhost:5001/health

# Backend health
curl http://localhost:8080/api/health

# ML service through backend proxy
curl http://localhost:8080/api/ml/health
```

### 2. Test ML Recommendations (Backend)

```bash
curl -X POST http://localhost:8080/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "analysis": {
      "district": "Gasabo",
      "districtId": "district_gasabo_123",
      "avgTravel": 45,
      "target": 30,
      "bounds": {
        "minLat": -2.0,
        "maxLat": -1.9,
        "minLon": 30.0,
        "maxLon": 30.15
      }
    }
  }'
```

**Expected response:**
```json
{
  "success": true,
  "analysis": {...},
  "recommendation": {
    "recommendations": [
      {
        "name": "Gasabo Health Center (North)",
        "lat": -1.983,
        "lon": 30.075,
        "type": "health_center",
        "justification": "ML-identified built-up area with 100.0% confidence...",
        "ml_confidence": "high",
        "ml_probability": "1.000"
      }
    ],
    "summary": "Identified 3 optimal locations using ML analysis...",
    "ml_enhanced": true
  },
  "method": "ml"
}
```

**Key indicators:**
- `"method": "ml"` - ML service was used (not LLM fallback)
- `"ml_enhanced": true` - Recommendations are ML-based
- `ml_probability` and `ml_confidence` fields present

### 3. Test via Frontend

1. Open http://localhost:3000 in your browser
2. Navigate to **Health Facility Planner**
3. Select a district (e.g., "Gasabo")
4. Set target travel time (e.g., 30 minutes)
5. Click **"Analyze District"**
6. Click **"Get Recommendations"**

**What to expect:**
- 3 recommendations appear with coordinates
- Each shows "ML-identified built-up area" in justification
- Map displays recommended locations as markers
- Check browser console for logs showing "ML recommendations generated successfully"

## Troubleshooting

### Issue: "ML service unavailable"

**Causes:**
- ML service not running
- Wrong port (should be 5001)
- `ML_ENABLED=false` in backend .env

**Solution:**
```bash
# Check ML service is running
curl http://localhost:5001/health

# Check backend .env has ML_ENABLED=true
cat backend/.env | grep ML_ENABLED

# Restart services
```

### Issue: "Model not loaded"

**Cause:** ML model file missing

**Solution:**
```bash
# Check model file exists
ls -la ml-service/models/healthcare_model.pkl

# If missing, train the model first
cd ml-service
python scripts/train_model.py
```

### Issue: Frontend shows old deployed URL error

**Cause:** `.env` not properly loaded

**Solution:**
```bash
# Verify frontend .env exists
cat frontend-react/frontend/.env

# Should show: REACT_APP_API_URL=http://localhost:8080

# Restart React dev server
cd frontend-react/frontend
npm start
```

### Issue: "Both ML and LLM recommendation services failed"

**Causes:**
- ML service down AND Ollama LLM not running
- Network/connection issues

**Solution:**
```bash
# Check all services are running:
curl http://localhost:5001/health  # ML service
curl http://localhost:8080/api/health  # Backend
curl http://localhost:11434/api/tags  # Ollama (optional)

# Check backend logs for specific errors
```

### Issue: Predictions fail with GEE errors

**Cause:** Google Earth Engine not configured

**Solution:**
The ML service can run without GEE but predictions from coordinates won't work. To enable:
1. Get GEE credentials from Google Cloud
2. Save to `ml-service/credentials/gee-credentials.json`
3. Update `ml-service/.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=credentials/gee-credentials.json
   ```

## How It Works

### Recommendation Flow

1. **Frontend** → User selects district and clicks "Get Recommendations"
2. **Frontend** → Sends analysis data to `POST /api/recommend`
3. **Backend** → Checks `ML_ENABLED=true`
4. **Backend** → Generates 20 candidate locations in district bounds
5. **Backend** → Calls ML Service for each location: `POST /api/predict-from-location`
6. **ML Service** → Fetches satellite imagery (if GEE configured)
7. **ML Service** → Extracts features (RGB, NDVI, built-up index, brightness)
8. **ML Service** → Runs Random Forest model to predict built-up areas
9. **ML Service** → Returns prediction (0/1) + probability (0-1)
10. **Backend** → Filters suitable locations (prediction=1, probability>0.6)
11. **Backend** → Selects top 3 by probability
12. **Backend** → Formats recommendations with coordinates and justifications
13. **Backend** → Stores in Supabase
14. **Frontend** → Displays recommendations on map

### Fallback Behavior

If ML service fails, the system automatically falls back to Ollama LLM:
- Response will have `"method": "llm-fallback"`
- Recommendations will be text-based (not satellite-based)

## Deployment Notes

### Production URLs

When deploying to production, update:

**Frontend `.env`:**
```bash
REACT_APP_API_URL=https://backend-207839009331.us-central1.run.app
```

**Backend `.env`:**
```bash
ML_SERVICE_URL=https://ml-service-your-url.run.app
ML_ENABLED=true
```

### Cloud Run / Docker

The services can be deployed to Cloud Run using the included `docker-compose.yml`:

```bash
# Build and run all services
docker-compose up --build

# Or deploy individually to Cloud Run
gcloud run deploy backend --source ./backend
gcloud run deploy ml-service --source ./ml-service
gcloud run deploy frontend --source ./frontend-react/frontend
```

## Additional Resources

- **ML Service API Docs:** `http://localhost:5001/docs` (FastAPI auto-generated)
- **Backend Routes:** See `backend/routes/` folder
- **Frontend Components:** See `frontend-react/frontend/src/components/`
- **Model Training:** See `ml-service/scripts/train_model.py`

## Summary Checklist

- [ ] All three `.env` files created with proper configuration
- [ ] `ML_ENABLED=true` in `backend/.env`
- [ ] Supabase credentials updated in all `.env` files
- [ ] ML Service running on port 5001
- [ ] Backend running on port 8080
- [ ] Frontend running on port 3000
- [ ] Health checks pass for all services
- [ ] Test recommendation returns `"method": "ml"`
- [ ] Frontend displays ML-based recommendations with confidence scores
