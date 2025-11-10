# Setup Guide

Complete setup instructions for the Healthcare Facility Finder application.

## Quick Start (5 Minutes)

```bash
# 1. Configure environment
cp .env.template backend/.env
# Edit backend/.env with your Supabase credentials

# 2. Set up database
# Run SUPABASE_SETUP.sql in your Supabase SQL Editor

# 3. Export ML model (or use dummy for testing)
python scripts/export_model.py

# 4. Start all services
./scripts/start_all_services.sh

# 5. Open browser
open http://localhost:3000
```

---

## Prerequisites

- **Node.js 18+** (`node --version`)
- **Python 3.8+** (`python3 --version`)
- **npm** (`npm --version`)
- **Supabase Account** ([Create free account](https://supabase.com))

---

## 1. Database Setup

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to finish setting up (~2 minutes)
3. Note your project URL and API keys from Settings → API

### Run Database Migrations

In Supabase Dashboard → SQL Editor, run the `SUPABASE_SETUP.sql` file. This creates:

- Districts table with Rwanda sample data
- Health facilities table
- Population cells table
- Recommendations table
- All necessary indexes and RLS policies

**Verify it worked:**
```sql
SELECT name, population FROM districts;
-- Should show 7 districts (Kayonza, Rwamagana, Nyagatare, Ngoma, Gasabo, Kicukiro, Nyarugenge)
```

---

## 2. Environment Configuration

### Backend Configuration

Edit `backend/.env`:

```env
# Supabase (REQUIRED - get from Supabase Dashboard → Settings → API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Server
PORT=8080

# ML Service (already configured)
ML_ENABLED=true
ML_SERVICE_URL=http://localhost:5001
USE_ML_FOR_RECOMMENDATIONS=true
```

### Frontend Configuration (Optional)

The frontend uses environment variables from `frontend-react/frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### ML Service Configuration (Optional)

Edit `ml-service/.env` if needed:

```env
ML_SERVICE_PORT=5001
MODEL_PATH=models/healthcare_model.pkl
```

---

## 3. Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend-react/frontend
npm install
```

### ML Service
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## 4. ML Model Setup

You have two options:

### Option A: Use Pre-trained Model (Recommended for Testing)

```bash
python scripts/export_model.py
# Select option 2 for dummy model
```

### Option B: Train Your Own Model

1. Download satellite data:
   ```bash
   python scripts/download_data_simple.py
   ```

2. Train the model:
   ```bash
   python scripts/train_model.py
   ```

3. Export the model:
   ```bash
   python scripts/export_model.py
   # Select option 1 to export trained model
   ```

See [docs/ML_GUIDE.md](ML_GUIDE.md) for detailed ML setup instructions.

---

## 5. Start Services

### Option A: All Services at Once (Recommended)

```bash
./scripts/start_all_services.sh
```

This starts:
- ML Service (port 5001)
- Backend (port 8080)
- Frontend (port 3000)

### Option B: Individual Services

**Terminal 1 - ML Service:**
```bash
cd ml-service
source venv/bin/activate
python -m app.main
```

**Terminal 2 - Backend:**
```bash
cd backend
npm start
```

**Terminal 3 - Frontend:**
```bash
cd frontend-react/frontend
npm start
```

---

## 6. Verify Installation

### Health Checks

```bash
# ML Service
curl http://localhost:5001/health
# Should return: {"status":"healthy","model_loaded":true}

# Backend
curl http://localhost:8080/api/health
# Should return: {"status":"ok"}

# ML Integration
curl http://localhost:8080/api/ml/health
# Should return ML service status
```

### Test Frontend

Open http://localhost:3000 in your browser. You should see the Healthcare Facility Finder home page.

---

## 7. Admin User Setup

To approve user signups, you need an admin account:

1. **Create admin user in Supabase Dashboard:**
   - Go to Authentication → Users → Add User
   - Enter email and password
   - Check "Auto Confirm User"
   - Note the User ID

2. **Grant admin privileges:**
   In Supabase SQL Editor:
   ```sql
   INSERT INTO user_profiles (id, email, first_name, last_name, role, is_admin, approval_status)
   VALUES (
     'YOUR-USER-ID-HERE',
     'admin@example.com',
     'Admin',
     'User',
     'admin',
     true,
     'approved'
   );
   ```

3. **Log in as admin:**
   - Go to http://localhost:3000/login
   - Enter admin credentials
   - You'll be redirected to the admin dashboard

See [docs/ADMIN_GUIDE.md](ADMIN_GUIDE.md) for more details.

---

## Testing the Application

### 1. Test District Analysis

1. Navigate to Health Facility Planner
2. Select district: "Gasabo"
3. Set target travel time: 30 minutes
4. Click "Analyze District"
5. View current facility statistics

### 2. Test ML Recommendations

1. After analysis, click "Get Recommendations"
2. You should see 3 recommendations with:
   - ML confidence scores
   - Coordinates (lat/lon)
   - Justification mentioning "ML-identified built-up area"
3. Check that `method: "ml"` appears in browser console

---

## Troubleshooting

### "ML model not found"

**Solution:** Run `python scripts/export_model.py` and select option 2 for dummy model

### "CORS error" in frontend

**Solution:** Verify `REACT_APP_API_URL=http://localhost:8080` in `frontend-react/frontend/.env`

### "Supabase connection failed"

**Solution:** Check your Supabase credentials in `backend/.env` are correct

### Port already in use

**Solution:**
```bash
./scripts/stop_all_services.sh
# Wait a few seconds
./scripts/start_all_services.sh
```

### ML recommendations fail

**Solution:**
1. Check ML service is running: `curl http://localhost:5001/health`
2. Verify `ML_ENABLED=true` in `backend/.env`
3. Check `ml-service/models/healthcare_model.pkl` exists

---

## Architecture Overview

```
Frontend (React)          :3000
    ↓
Backend (Express)         :8080
    ↓                       ↓
ML Service (FastAPI)  :5001   Supabase (PostgreSQL/PostGIS)
```

### Tech Stack

- **Frontend:** React, Mapbox GL, Tailwind CSS
- **Backend:** Node.js, Express
- **ML Service:** Python, FastAPI, scikit-learn, Google Earth Engine
- **Database:** Supabase (PostgreSQL + PostGIS)

---

## Next Steps

- [ML Integration Guide](ML_GUIDE.md) - Train and deploy ML models
- [Admin Guide](ADMIN_GUIDE.md) - Manage users and approvals
- [Data Download Guide](DATA_DOWNLOAD.md) - Download satellite imagery
- [Architecture Documentation](ARCHITECTURE.md) - System design details

---

## Need Help?

1. Check the troubleshooting section above
2. Review Supabase logs (Dashboard → Logs)
3. Check browser console (F12 → Console)
4. Review terminal output for errors

**Last Updated:** 2025-11-10
