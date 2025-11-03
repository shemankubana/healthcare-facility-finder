# Healthcare Facility Planner - Setup Instructions

## Overview
This is a one-day proof-of-concept interactive web app where Ministry of Health planners can analyze healthcare accessibility and get AI-powered recommendations for new facility locations.

## Prerequisites
- Node.js 18+
- Docker & Docker Compose (optional, for containerized deployment)
- Supabase account (free tier)
- Ollama (for local LLM inference) - optional if using cloud LLM

## Quick Start (Local Development)

### 1. Database Setup (Supabase)

1. Go to [supabase.io](https://supabase.io) and create a free project
2. Wait for the project to be created
3. In the SQL editor, run the migrations from `supabase/migrations/`

Or use the dashboard:
- Enable PostGIS extension
- Create the tables manually using the SQL from the backend migration files

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# OLLAMA_URL=http://localhost:11434 (if using local Ollama)

# Install dependencies
npm install

# Start the server
npm run dev
```

The API will be available at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend-react/frontend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm start
```

The app will be available at `http://localhost:3000`

### 4. LLM Setup (Optional - for AI recommendations)

#### Option A: Local Ollama (Recommended for PoC)

```bash
# Install Ollama from https://ollama.ai

# Pull a model
ollama pull mistral
# or
ollama pull llama3
# or
ollama pull phi3:mini

# Start Ollama
ollama serve

# In another terminal, the API will be at http://localhost:11434
```

#### Option B: Cloud LLM
- Modify `backend/services/llm.js` to use OpenAI, Anthropic, or other cloud APIs
- Update environment variables accordingly

## Usage

1. **Access the app**: http://localhost:3000/planner
2. **Select a district** from the dropdown
3. **Set target travel time** (e.g., 30 minutes - WHO standard)
4. **Click "Analyze District"** - shows current facilities, population, and travel times
5. **Click "Get Recommendations"** - LLM suggests 3 new facility locations
6. **View on map** - See recommendations visualized with existing facilities

## API Endpoints

```
GET  /api/districts                 - List all districts
GET  /api/analyze?district=X&targetTravel=Y - Analyze a district
POST /api/recommend                 - Get LLM recommendations
GET  /api/recommend/history/:districtId - View past recommendations
GET  /api/health                    - Health check
```

## Deployment Options

### Option 1: Docker Compose (All-in-One)

```bash
# Create .env file with Supabase credentials
cp backend/.env.example .env
# Edit .env

# Build and run
docker-compose up -d

# Access:
# Frontend: http://localhost:3000
# API: http://localhost:5000
# Ollama: http://localhost:11434
```

### Option 2: Vercel + Render + Supabase

**Frontend (Vercel):**
```bash
# Push to GitHub
git push origin main

# Connect repo to Vercel
# Set environment variables:
# REACT_APP_API_URL=https://your-render-app.onrender.com

# Deploy automatically on push
```

**Backend (Render):**
1. Create new Web Service on render.com
2. Connect GitHub repo
3. Set environment variables in dashboard
4. Build command: `npm install`
5. Start command: `npm start`

### Option 3: GCP Cloud Run

```bash
# Build and push to GCP
gcloud run deploy health-facility-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars SUPABASE_URL=...,SUPABASE_ANON_KEY=...
```

## Project Structure

```
/
├── backend/                    # Node/Express API
│   ├── server.js              # Main server file
│   ├── routes/
│   │   ├── analyze.js         # Analysis endpoint
│   │   ├── recommend.js       # Recommendations endpoint
│   │   └── districts.js       # Districts endpoint
│   ├── services/
│   │   └── llm.js             # LLM integration
│   ├── lib/
│   │   └── supabase.js        # Supabase client
│   └── package.json
│
├── frontend-react/frontend/    # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   └── HealthFacilityPlanner.jsx  # Main page
│   │   ├── components/
│   │   │   ├── MapView.jsx
│   │   │   ├── AnalysisCard.jsx
│   │   │   ├── RecommendationsList.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   └── App.js
│   └── package.json
│
├── supabase/
│   └── migrations/            # Database migrations
│
└── docker-compose.yml         # Docker setup
```

## Features Implemented

✅ Interactive district selection
✅ Real-time accessibility analysis
✅ AI-powered facility recommendations using local LLM
✅ Map visualization with markers
✅ Responsive design
✅ Database persistence
✅ RESTful API
✅ Docker support
✅ Environment-based configuration

## Performance Notes

- Lightweight GIS operations using turf.js
- Pre-computed population density (from GeoTIFF tiles)
- LLM runs locally (no API costs)
- Database queries optimized with spatial indexes
- Frontend caching to minimize API calls

## Troubleshooting

### Ollama not responding
- Ensure Ollama is running: `ollama serve`
- Check URL: http://localhost:11434
- Model not loaded: `ollama pull mistral`

### Database connection failed
- Verify Supabase credentials in .env
- Check internet connection
- PostGIS extension enabled?

### Frontend can't reach API
- Verify `REACT_APP_API_URL` in frontend .env
- Check CORS headers in backend
- API running on port 5000?

### Port already in use
```bash
# Find and kill process using port 5000
lsof -i :5000
kill -9 <PID>
```

## Next Steps (Post-PoC)

1. Replace mock travel times with real OSRM routing data
2. Add user authentication
3. Implement facility cost/capacity constraints
4. Add multi-district comparison views
5. Real-time data updates from health information systems
6. Export recommendations to PDF/GeoJSON
7. Integration with GIS software (QGIS)

## Support & Feedback

For issues or questions, check:
- Backend logs: Check server console
- Frontend logs: Browser DevTools (F12)
- Database: Supabase dashboard SQL editor
