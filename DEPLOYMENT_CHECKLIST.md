# Healthcare Facility Planner - Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Structure
- [x] Backend folder structure
  - [x] server.js exists
  - [x] routes/ with 3 files
  - [x] services/llm.js
  - [x] lib/supabase.js
  - [x] package.json
  - [x] Dockerfile

- [x] Frontend folder structure
  - [x] src/pages/HealthFacilityPlanner.jsx
  - [x] src/components/ with 4 files
  - [x] App.js updated with /planner route
  - [x] package.json updated with deps
  - [x] Dockerfile & nginx.conf

- [x] Configuration files
  - [x] .env.template created
  - [x] backend/.env.example
  - [x] frontend/.env.example
  - [x] docker-compose.yml

- [x] Documentation
  - [x] QUICKSTART.md (10-min setup)
  - [x] SETUP_INSTRUCTIONS.md (full guide)
  - [x] IMPLEMENTATION_SUMMARY.md (details)
  - [x] ARCHITECTURE.md (diagrams)
  - [x] README_PLANNER.md (overview)

### ✅ Database
- [x] Supabase migrations applied
  - [x] districts table
  - [x] health_facilities table
  - [x] population_cells table
  - [x] recommendations table
  - [x] PostGIS extension
  - [x] RLS policies
  - [x] Spatial indexes

- [x] Sample data loaded
  - [x] 4 districts with geometry
  - [x] 20+ health facilities
  - [x] Population grid data
  - [x] Realistic coordinates

### ✅ Backend
- [x] Express server configured
  - [x] CORS enabled
  - [x] JSON parser
  - [x] Route handlers

- [x] API endpoints working
  - [x] GET /api/health
  - [x] GET /api/districts
  - [x] GET /api/analyze
  - [x] POST /api/recommend
  - [x] GET /api/recommend/history

- [x] LLM integration
  - [x] Ollama service wrapper
  - [x] Fallback responses
  - [x] Error handling
  - [x] JSON parsing

- [x] Dependencies
  - [x] express
  - [x] @supabase/supabase-js
  - [x] cors
  - [x] dotenv
  - [x] node-fetch

### ✅ Frontend
- [x] React components
  - [x] HealthFacilityPlanner.jsx (main page)
  - [x] MapView.jsx (Leaflet)
  - [x] AnalysisCard.jsx (metrics)
  - [x] RecommendationsList.jsx (AI suggestions)
  - [x] LoadingSpinner.jsx

- [x] Routing
  - [x] /planner route added
  - [x] App.js updated
  - [x] Router configured

- [x] Dependencies
  - [x] react & react-dom
  - [x] react-router-dom
  - [x] leaflet & react-leaflet
  - [x] axios
  - [x] tailwindcss

- [x] Styling
  - [x] Tailwind configured
  - [x] Responsive design
  - [x] Color scheme consistent

## Local Development Setup

### Step 1: Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm or yarn available
- [ ] Supabase account created
- [ ] Project created in Supabase
- [ ] PostGIS extension enabled
- [ ] Ollama installed (optional but recommended)

### Step 2: Backend Setup
```bash
# [ ] Copy environment
cp backend/.env.example backend/.env

# [ ] Edit backend/.env with:
#     - SUPABASE_URL (from Supabase settings)
#     - SUPABASE_ANON_KEY (from Supabase settings)
#     - OLLAMA_URL=http://localhost:11434
#     - OLLAMA_MODEL=mistral

# [ ] Install dependencies
cd backend
npm install

# [ ] Verify server starts
npm run dev
# Expected: "Server running on http://localhost:5000"
```

### Step 3: Frontend Setup
```bash
# [ ] Copy environment
cp frontend-react/frontend/.env.example frontend-react/frontend/.env

# [ ] File should contain:
#     REACT_APP_API_URL=http://localhost:5000

# [ ] Install dependencies
cd frontend-react/frontend
npm install

# [ ] Start dev server
npm start
# Expected: Opens http://localhost:3000 in browser
```

### Step 4: LLM Setup (Optional)
```bash
# [ ] Install Ollama (if not already)
# [ ] Pull model: ollama pull mistral
# [ ] Start Ollama: ollama serve
# Expected: Listens on http://localhost:11434
```

### Step 5: Verify Functionality
- [ ] Access http://localhost:3000/planner
- [ ] Districts dropdown shows options
- [ ] Can set target travel time
- [ ] "Analyze District" button works
- [ ] Analysis displays with 4 metric cards
- [ ] Status shows "UNDERSERVED" (red badge)
- [ ] "Get Recommendations" button appears
- [ ] Click recommendation button
- [ ] 3 recommendations appear on map
- [ ] Map shows markers with popups
- [ ] No JavaScript errors in console (F12)

## Docker Deployment

### Prerequisites
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Supabase credentials ready

### Build & Run
```bash
# [ ] Create .env in project root
cp backend/.env.example .env

# [ ] Edit .env with Supabase credentials

# [ ] Build and start services
docker-compose up -d

# [ ] Verify all services running
docker-compose ps
# Expected: 3 services (api, web, ollama)

# [ ] Verify connectivity
curl http://localhost:5000/api/health
curl http://localhost:3000
curl http://localhost:11434/api/tags

# [ ] Access frontend
# Open: http://localhost:3000

# [ ] Stop services when done
docker-compose down
```

## Cloud Deployment

### Option A: Vercel + Render + Supabase

#### Frontend (Vercel)
- [ ] Create Vercel account
- [ ] Connect GitHub repo
- [ ] Configure environment variables:
  - [ ] REACT_APP_API_URL=https://your-backend.onrender.com
- [ ] Deploy (auto on push)
- [ ] Verify: https://your-project.vercel.app/planner

#### Backend (Render)
- [ ] Create Render account
- [ ] Create new Web Service
- [ ] Connect GitHub repo
- [ ] Set environment variables:
  - [ ] SUPABASE_URL=...
  - [ ] SUPABASE_ANON_KEY=...
  - [ ] OLLAMA_URL=http://localhost:11434 (or cloud)
  - [ ] PORT=5000
- [ ] Deploy
- [ ] Verify: https://your-backend.onrender.com/api/health

#### Database (Supabase)
- [ ] Already created
- [ ] Migrations applied
- [ ] Data loaded

#### LLM (Ollama)
- [ ] Option 1: Keep on local machine
- [ ] Option 2: Host on GCP VM
- [ ] Update OLLAMA_URL in backend

### Option B: GCP Cloud Run

```bash
# [ ] Create GCP project
# [ ] Enable Cloud Run API
# [ ] Install gcloud CLI

# [ ] Authenticate
gcloud auth login

# [ ] Deploy backend
gcloud run deploy health-facility-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars \
    SUPABASE_URL=...,\
    SUPABASE_ANON_KEY=...,\
    OLLAMA_URL=...

# [ ] Deploy frontend
# Push to Vercel (easier than Cloud Run)
```

## Post-Deployment Testing

### Functionality Tests
- [ ] Access application URL
- [ ] Load page without errors
- [ ] District dropdown populates
- [ ] Select district triggers no errors
- [ ] Set travel time input works
- [ ] "Analyze" button works
- [ ] Analysis loads within 5 seconds
- [ ] Metrics display correctly
- [ ] Status badge shows (red or green)
- [ ] "Recommend" button appears
- [ ] Recommendations load within 10 seconds
- [ ] Map displays with markers
- [ ] Can click markers for popups
- [ ] No JavaScript errors in console

### Performance Tests
- [ ] Frontend load time < 3 seconds
- [ ] API response time < 1 second
- [ ] LLM response time < 10 seconds
- [ ] Map renders smoothly
- [ ] No memory leaks (check DevTools)

### Error Handling
- [ ] Invalid district selection handled
- [ ] Missing environment variables caught
- [ ] Database errors shown to user
- [ ] LLM timeout handled gracefully
- [ ] Network errors display message

### Data Validation
- [ ] Supabase data loaded
- [ ] Geometry data valid
- [ ] Population data populated
- [ ] Facilities displayed correctly
- [ ] Recommendations within bounds

## Monitoring & Maintenance

### Logs to Monitor
- [ ] Backend console errors
- [ ] Frontend console errors
- [ ] Database query logs
- [ ] LLM response times

### Health Checks
- [ ] Weekly: Verify API health endpoint
- [ ] Weekly: Test each district analysis
- [ ] Monthly: Check database size
- [ ] Monthly: Verify LLM model availability

### Updates
- [ ] Monitor npm package updates
- [ ] Update dependencies monthly
- [ ] Review security advisories
- [ ] Test updates in staging first

## Troubleshooting Checklist

### "Cannot connect to Supabase"
- [ ] Verify SUPABASE_URL format
- [ ] Check SUPABASE_ANON_KEY is not empty
- [ ] Verify project is active in Supabase
- [ ] Check internet connectivity

### "LLM not responding"
- [ ] Is Ollama service running?
- [ ] Is OLLAMA_URL correct?
- [ ] Try: curl http://localhost:11434/api/tags
- [ ] Restart Ollama service

### "Port already in use"
- [ ] Check: lsof -i :5000 (backend)
- [ ] Check: lsof -i :3000 (frontend)
- [ ] Kill process: kill -9 <PID>
- [ ] Or change PORT in .env

### "API CORS errors"
- [ ] Verify REACT_APP_API_URL is correct
- [ ] Check backend CORS headers
- [ ] Verify frontend and backend on same domain (production)
- [ ] Check browser console for full error

### "Empty analysis results"
- [ ] Verify sample data loaded
- [ ] Check database with Supabase GUI
- [ ] Verify district name exact match
- [ ] Check population_cells table has data

## Deployment Sign-Off

- [ ] Code reviewed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Sample data verified
- [ ] Deployment script working
- [ ] Health checks passing
- [ ] Performance acceptable
- [ ] Error handling working
- [ ] Logging configured
- [ ] Security reviewed
- [ ] Backup plan in place
- [ ] Team trained on usage
- [ ] Ready for production

## Success Criteria

✅ All checks above completed
✅ Application accessible
✅ All 4 districts analyzable
✅ Recommendations generating
✅ Map displaying correctly
✅ No critical errors
✅ Performance acceptable
✅ Documentation complete
✅ Team understands usage
✅ Ready for stakeholder demo

---

**Version**: 1.0.0
**Last Updated**: November 2024
**Status**: Ready for deployment
