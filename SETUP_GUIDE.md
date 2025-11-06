# Healthcare Facility Finder - Complete Setup & Troubleshooting Guide

## Quick Setup Checklist

- [ ] Python 3.9+ installed
- [ ] Node.js 16+ and npm installed
- [ ] Supabase account created
- [ ] Database migrations run
- [ ] Backend `.env` configured
- [ ] Frontend `.env` configured
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000

---

## 1. Database Setup (CRITICAL - Do This First!)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in:
   - **Name**: healthcare-facility-finder
   - **Database Password**: Save this securely!
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine

### Step 2: Run Database Migrations

Go to your Supabase dashboard → **SQL Editor** and run these three migrations **in order**:

#### Migration 1: Create main schema
Copy and paste the entire contents of:
```
supabase/migrations/20251103230158_create_health_facilities_schema.sql
```

Click **Run** and wait for "Success" ✅

#### Migration 2: Load sample data
Copy and paste the entire contents of:
```
supabase/migrations/20251103230226_load_sample_rwanda_data.sql
```

Click **Run** and wait for "Success" ✅

#### Migration 3: Create signup_requests table
Copy and paste the entire contents of:
```
supabase/migrations/20251106000000_create_signup_requests_table.sql
```

Click **Run** and wait for "Success" ✅

### Step 3: Get Your Credentials

In Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (long string)
   - **service_role secret**: Click "Reveal" and copy

---

## 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `backend/.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
PORT=5000
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

You should see: `✅ Server running on port 5000`

---

## 3. Frontend Setup

```bash
cd frontend-react/frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend-react/frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Start the frontend:

```bash
npm start
```

Browser should open to: `http://localhost:3000`

---

## 4. Testing the API

### Test 1: Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-11-06T..."}
```

### Test 2: Get Districts
```bash
curl http://localhost:5000/api/districts
```

Expected response (array of districts):
```json
[
  {
    "id": "uuid-here",
    "name": "Kayonza",
    "population": 400000,
    "area_km2": 800
  },
  ...
]
```

### Test 3: Analyze a District
```bash
curl "http://localhost:5000/api/analyze?district=Kayonza&targetTravel=30"
```

Expected response (save this output!):
```json
{
  "district": "Kayonza",
  "districtId": "uuid-here",
  "population": 190000,
  "currentFacilities": 5,
  "avgTravel": 40,
  "target": 30,
  "bounds": {
    "minLat": -2.2,
    "maxLat": -1.6,
    "minLon": 29.8,
    "maxLon": 30.5
  },
  ...
}
```

### Test 4: Get Recommendations (CORRECT WAY)

**IMPORTANT**: You MUST use the full analysis object from Test 3!

```bash
# First, get the analysis
ANALYSIS=$(curl -s "http://localhost:5000/api/analyze?district=Kayonza&targetTravel=30")

# Then pass it to recommend endpoint
curl -X POST http://localhost:5000/api/recommend \
  -H "Content-Type: application/json" \
  -d "{\"analysis\": $ANALYSIS}"
```

Or manually with the full response from `/api/analyze`:

```bash
curl -X POST http://localhost:5000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "analysis": {
      "district": "Kayonza",
      "districtId": "actual-uuid-from-districts-endpoint",
      "population": 190000,
      "area_km2": 800,
      "population_density": "237.5",
      "currentFacilities": 5,
      "facilityBreakdown": {
        "hospitals": 1,
        "health_centers": 2,
        "clinics": 2
      },
      "totalCapacity": 265,
      "avgTravel": 40,
      "target": 30,
      "populationPerFacility": 38000,
      "gap_status": "UNDERSERVED",
      "bounds": {
        "minLat": -2.2,
        "maxLat": -1.6,
        "minLon": 29.8,
        "maxLon": 30.5
      }
    }
  }'
```

---

## 5. Common Errors & Solutions

### ❌ Error: "Cannot GET /api/accessibility"

**Problem**: Wrong endpoint name (from old README)

**Solution**: Use `/api/analyze?district=X&targetTravel=Y` instead

---

### ❌ Error: "Cannot read properties of undefined (reading 'minLat')"

**Problem**: Missing `bounds` property in analysis object

**Solution**:
1. First call `/api/analyze?district=Kayonza&targetTravel=30`
2. Save the entire response
3. Pass that complete response to `/api/recommend`

See Test 4 above for the correct approach.

---

### ❌ Error: "Could not find the table 'public.signup_requests'"

**Problem**: Database migration not run

**Solution**:
1. Go to Supabase Dashboard → SQL Editor
2. Run the migration: `supabase/migrations/20251106000000_create_signup_requests_table.sql`
3. Verify the table exists: Run `SELECT * FROM signup_requests;` in SQL Editor

---

### ❌ Error: "Failed to connect to localhost port 5000"

**Problem**: Backend server not running

**Solution**:
```bash
cd backend
npm run dev
```

---

### ❌ Error: CORS issues in frontend

**Problem**: Backend not allowing frontend requests

**Solution**:
1. Check backend `.env` has correct settings
2. Restart backend server
3. Ensure `REACT_APP_API_URL=http://localhost:5000` in frontend `.env`

---

## 6. Verify Everything is Working

Run this complete test flow:

```bash
# 1. Health check
curl http://localhost:5000/api/health

# 2. Get districts
curl http://localhost:5000/api/districts

# 3. Analyze district
curl "http://localhost:5000/api/analyze?district=Kayonza&targetTravel=30" > analysis.json

# 4. Get recommendations (using saved analysis)
curl -X POST http://localhost:5000/api/recommend \
  -H "Content-Type: application/json" \
  -d @analysis.json
```

If all four commands work, your setup is complete! ✅

---

## 7. Available Districts

The sample database includes these districts:

- **Kayonza** - 5 facilities, 400,000 population
- **Rwamagana** - 5 facilities, 350,000 population
- **Nyagatare** - 6 facilities, 450,000 population
- **Ngoma** - 4 facilities, 200,000 population

---

## 8. Optional: Ollama Setup (for AI Recommendations)

If you don't have Ollama, the backend will use fallback recommendations. To enable AI:

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull the model:
   ```bash
   ollama pull mistral
   ```
3. Start Ollama:
   ```bash
   ollama serve
   ```
4. Restart your backend

---

## 9. Project Structure

```
healthcare-facility-finder/
├── backend/                          # Node.js API
│   ├── .env                         # ← Create this
│   ├── server.js
│   ├── routes/
│   │   ├── analyze.js               # GET /api/analyze
│   │   ├── districts.js             # GET /api/districts
│   │   └── recommend.js             # POST /api/recommend
│   └── services/
│       └── llm.js                   # AI recommendations
│
├── frontend-react/frontend/         # React app
│   ├── .env                        # ← Create this
│   └── src/
│
├── supabase/migrations/            # Database schema
│   ├── ...158_create_health_facilities_schema.sql
│   ├── ...226_load_sample_rwanda_data.sql
│   └── ...000_create_signup_requests_table.sql  # ← NEW!
│
└── SETUP_GUIDE.md                  # ← You are here
```

---

## 10. Next Steps

1. ✅ Verify all API endpoints work (see Section 6)
2. 🌐 Test frontend in browser at `http://localhost:3000`
3. 👤 Try creating a user account (sign up)
4. 🗺️ Explore the map interface
5. 📊 Run analysis on different districts
6. 🤖 Generate AI recommendations

---

## Need Help?

If you encounter issues not covered here:

1. Check backend logs in the terminal where you ran `npm run dev`
2. Check browser console (F12) for frontend errors
3. Verify Supabase is online (check dashboard)
4. Ensure all migrations ran successfully
5. Double-check all `.env` files have correct credentials

---

**Last Updated**: 2025-11-06
