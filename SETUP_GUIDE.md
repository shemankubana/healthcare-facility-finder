# 🚀 Healthcare Facility Finder - Complete Setup Guide

## Quick Start (5 Minutes)

```bash
# 1. Export ML model from notebook (or create dummy for testing)
python3 export_model.py

# 2. Configure backend (add your Supabase credentials)
nano backend/.env

# 3. Start all services
./start_all_services.sh

# 4. Open browser
open http://localhost:3000
```

---

## ⚠️ ALL ISSUES HAVE BEEN FIXED

✅ **Frontend API URL** - Fixed from port 5000 → 8080  
✅ **Backend .env** - Created with ML enabled  
✅ **ML Model Export** - Added export cell to notebook + Python script  
✅ **Service Integration** - Backend properly connected to ML service  
✅ **Startup Scripts** - Automated start/stop for all services

---

## 📋 Prerequisites

- **Node.js 18+** (\`node --version\`)
- **Python 3.8+** (\`python3 --version\`)
- **npm** (\`npm --version\`)
- **Supabase Account** (for database - get from https://supabase.com)

---

## 🎯 What You Need to Do

### 1. Export ML Model (CRITICAL!)

**Run this in your notebook AFTER training:**

Open `capstoneNotebook.ipynb` and run the **NEW export cell** (after cell 44). It will:
- Package your trained model
- Export to `ml-service/models/healthcare_model.pkl`
- Verify it works

**OR use the Python script for testing:**

```bash
python3 export_model.py
# Select option 2 for dummy model (testing only)
```

### 2. Configure Backend

Edit `backend/.env` (already created for you):

```env
# REQUIRED: Get from Supabase Dashboard (https://supabase.com)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ML Service (already configured)
ML_ENABLED=true
ML_SERVICE_URL=http://localhost:5001
```

### 3. Start Everything

```bash
./start_all_services.sh
```

That's it! Everything else is already fixed and configured.

---

## ✅ What's Been Fixed

| Issue | Status | Solution |
|-------|--------|----------|
| Frontend port mismatch | ✅ Fixed | Changed from 5000 → 8080 in api.js |
| ML model missing | ✅ Fixed | Added export cell + Python script |
| Backend .env missing | ✅ Fixed | Created with ML enabled |
| No startup script | ✅ Fixed | Created start_all_services.sh |
| ML integration broken | ✅ Fixed | Backend configured correctly |

---

## 🧪 Testing

```bash
# Test ML Service
curl http://localhost:5001/health

# Test Backend
curl http://localhost:8080/api/health

# Test ML Integration
curl http://localhost:8080/api/ml/health

# Make a prediction
curl -X POST http://localhost:8080/api/ml/predict \
  -H "Content-Type: application/json" \
  -d '{"features": [0.5,0.1,0.6,0.12,0.4,0.09,0.3,0.05,0.45,0.08,0.48,0.11]}'
```

---

## 🐛 Troubleshooting

### "ML model not found"

**Solution**: Run the export cell in your notebook or `python3 export_model.py`

### "ML service not available"

**Solution**: 
1. Check ML service is running: `curl http://localhost:5001/health`
2. Check backend .env has `ML_ENABLED=true`

### "Frontend shows network error"

**Solution**: Already fixed! But verify: `grep 8080 frontend-react/frontend/src/lib/api.js`

### Port already in use

```bash
./stop_all_services.sh
# Wait a few seconds
./start_all_services.sh
```

---

## 📊 Architecture

```
Frontend (React:3000) → Backend (Express:8080) → ML Service (FastAPI:5001)
                              ↓
                         Supabase DB
```

---

## 🎉 Success Criteria

Your app is working when:

- ✅ `curl http://localhost:5001/health` shows `model_loaded: true`
- ✅ `curl http://localhost:8080/api/health` returns `status: ok`
- ✅ `curl http://localhost:8080/api/ml/health` shows ML is available
- ✅ Frontend opens at http://localhost:3000

---

**Need Help?** All issues have been fixed. Just run the scripts! 🚀
