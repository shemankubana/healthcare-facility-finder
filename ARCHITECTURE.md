# Healthcare Facility Planner - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│  http://localhost:3000/planner                                      │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                    HTTP/REST API Calls
                              │
        ┌─────────────────────┴──────────────────────┐
        │                                            │
┌───────▼────────────────┐          ┌───────────────▼───────────────┐
│  REACT FRONTEND        │          │  EXPRESS BACKEND API          │
│  (localhost:3000)      │          │  (localhost:5000)             │
├────────────────────────┤          ├───────────────────────────────┤
│                        │          │                               │
│ Pages:                 │          │ Endpoints:                    │
│  - HealthFacility      │◄────────►│  - GET /api/health           │
│    Planner             │          │  - GET /api/districts        │
│                        │          │  - GET /api/analyze          │
│ Components:            │          │  - POST /api/recommend       │
│  - MapView (Leaflet)   │          │  - GET /api/recommend/...    │
│  - AnalysisCard        │          │                              │
│  - Recommendations     │          │ Services:                     │
│  - LoadingSpinner      │          │  - LLM Integration           │
│                        │          │  - Data Analysis             │
│ State Management:      │          │                              │
│  - React useState      │          │ Libraries:                    │
│  - Axios HTTP client   │          │  - Express.js                │
│                        │          │  - Supabase JS SDK           │
│ Styling:               │          │  - Node-fetch                │
│  - Tailwind CSS        │          │                              │
│  - Leaflet CSS         │          │                              │
└────────────────────────┘          └───────────────┬───────────────┘
                                                    │
                                                    │
                    ┌───────────────────────────────┼────────────────┐
                    │                               │                │
        ┌───────────▼──────────────┐    ┌──────────▼─────────┐ ┌────▼────────┐
        │  SUPABASE (PostgreSQL)   │    │  OLLAMA LLM        │ │  Environment │
        │  (Cloud Database)        │    │  (localhost:11434) │ │  Variables   │
        │                          │    │                    │ └─────────────┘
        │ Tables:                  │    │ Model: mistral     │
        │  - districts             │    │                    │
        │  - health_facilities     │    │ Purpose:           │
        │  - population_cells      │    │  Generate AI       │
        │  - recommendations       │    │  recommendations   │
        │                          │    │  for facility      │
        │ Features:                │    │  placement         │
        │  - PostGIS spatial       │    │                    │
        │    indexes               │    │ Input:             │
        │  - Row Level Security    │    │  - Analysis data   │
        │  - Audit trail           │    │                    │
        │                          │    │ Output:            │
        │ Connection:              │    │  - JSON with 3     │
        │  - Supabase JS SDK       │    │    recommendations │
        │  - Environment vars      │    │                    │
        └──────────────────────────┘    └────────────────────┘
```

## Data Flow Diagram

```
USER INTERACTION
    │
    ├─► Select District
    ├─► Set Target Travel Time (30 min)
    ├─► Click "Analyze District"
    │
    ▼

FRONTEND (React)
    │
    ├─► Sends GET /api/analyze?district=Kayonza&targetTravel=30
    │
    ▼

BACKEND (Express)
    │
    ├─► Route handler: analyze.js
    │
    ├─► Query 1: Get district by name
    │   └─► FROM districts WHERE name = 'Kayonza'
    │
    ├─► Query 2: Get all facilities in district
    │   └─► FROM health_facilities WHERE district_id = ?
    │
    ├─► Query 3: Get population cells
    │   └─► FROM population_cells WHERE district_id = ?
    │
    ├─► Calculate metrics:
    │   ├─► Total population
    │   ├─► Average travel time
    │   ├─► Facility count by type
    │   ├─► Population per facility
    │   └─► Underserved status (gap_status)
    │
    └─► Return Analysis JSON
        ├─► district name
        ├─► population
        ├─► population_density
        ├─► currentFacilities
        ├─► facilityBreakdown
        ├─► avgTravel (current)
        ├─► target (desired)
        └─► gap_status

FRONTEND receives Analysis
    │
    └─► AnalysisCard displays:
        ├─ 📊 4 metric cards
        ├─ 🎯 Status badge (red for underserved)
        └─ 💡 Recommendations to add facilities

USER clicks "Get Recommendations"
    │
    ▼

FRONTEND (React)
    │
    └─► Sends POST /api/recommend with Analysis data

BACKEND (Express)
    │
    ├─► Route handler: recommend.js
    │
    ├─► Call LLM service
    │   └─► services/llm.js
    │
    └─► LLM Service
        ├─► Format prompt with analysis context
        │   ├─ District: Kayonza
        │   ├─ Population: 400,000
        │   ├─ Avg travel: 45 min (exceeds 30 min target)
        │   ├─ Current facilities: 4
        │   ├─ Geographic bounds: [lat/lon]
        │   └─ "Recommend 3 locations"
        │
        ├─► POST to Ollama: http://localhost:11434/api/generate
        │
        ├─► Ollama (mistral model) generates response:
        │   └─► JSON with 3 facility recommendations
        │
        ├─► Parse response
        │
        ├─► Store in recommendations table
        │   └─► INSERT into recommendations
        │       ├─ district_id
        │       ├─ analysis_input (JSON)
        │       ├─ recommendation_output (JSON)
        │       └─ created_at
        │
        └─► Return Recommendation JSON
            └─► recommendations: [
                    {
                      name: "Clinic A",
                      lat: -1.98,
                      lon: 30.09,
                      type: "health_center",
                      justification: "..."
                    },
                    ...
                ]

FRONTEND receives Recommendations
    │
    ├─► RecommendationsList component:
    │   ├─ Displays 3 cards with details
    │   ├─ Shows reasoning
    │   └─ Shows estimated impact
    │
    └─► MapView component:
        ├─ Existing facilities (green/red/orange markers)
        ├─ New recommendations (purple markers)
        ├─ Popups with details
        └─ Leaflet map controls

RESULT: User sees analysis + AI recommendations on interactive map
```

## Component Hierarchy

```
App.js (Router)
  │
  └─► Route: /planner
      │
      └─► HealthFacilityPlanner (Main Page)
          │
          ├─► Sidebar (Sticky)
          │   ├─ District Selector (Dropdown)
          │   ├─ Target Travel Input (Number)
          │   ├─ "Analyze District" Button
          │   ├─ "Get Recommendations" Button
          │   └─ Error Display
          │
          └─► Main Content Area
              │
              ├─► AnalysisCard (if analysis exists)
              │   ├─ Header (gradient bg)
              │   ├─ 4 Metric Cards
              │   │   ├─ Population
              │   │   ├─ Current Facilities
              │   │   ├─ Avg Travel Time
              │   │   └─ Per Facility
              │   └─ Status Alert
              │
              ├─► RecommendationsList (if recommendations exist)
              │   ├─ Header
              │   ├─ Summary Box
              │   ├─ 3 Recommendation Cards
              │   │   ├─ Name
              │   │   ├─ Type Badge
              │   │   ├─ Location
              │   │   ├─ Justification
              │   │   ├─ Impact Estimate
              │   │   └─ "View on Map" Button
              │   └─ Next Steps Box
              │
              └─► MapView
                  ├─ Leaflet MapContainer
                  ├─ TileLayer (OpenStreetMap)
                  ├─ Existing Facility Markers
                  │   ├─ Hospital (Red)
                  │   ├─ Health Center (Green)
                  │   ├─ Clinic (Orange)
                  │   └─ Popups with Details
                  ├─ Recommended Markers (Purple)
                  │   └─ Popups with Justification
                  └─ Circle overlay (district bounds)
```

## Database Schema

```
districts
├─ id (UUID, PK)
├─ name (text, UNIQUE)
├─ geom (geometry)
├─ population (bigint)
├─ area_km2 (numeric)
└─ created_at (timestamp)

health_facilities
├─ id (UUID, PK)
├─ name (text)
├─ type (enum: hospital, health_center, clinic)
├─ capacity (integer)
├─ services (text[])
├─ geom (geometry, INDEXED)
├─ district_id (FK → districts)
├─ created_at (timestamp)
└─ updated_at (timestamp)

population_cells
├─ id (UUID, PK)
├─ geom (geometry, INDEXED)
├─ pop_estimate (numeric)
├─ avg_travel_min (numeric)
├─ district_id (FK → districts)
└─ created_at (timestamp)

recommendations
├─ id (UUID, PK)
├─ district_id (FK → districts)
├─ user_id (FK → auth.users, nullable)
├─ target_travel_min (numeric)
├─ analysis_input (jsonb)
├─ recommendation_output (jsonb)
└─ created_at (timestamp)
```

## API Request/Response Examples

### 1. Get Districts
```
GET /api/districts

RESPONSE:
[
  { id: "...", name: "Kayonza", population: 400000, area_km2: 800 },
  { id: "...", name: "Rwamagana", population: 350000, area_km2: 850 },
  ...
]
```

### 2. Analyze District
```
GET /api/analyze?district=Kayonza&targetTravel=30

RESPONSE:
{
  "district": "Kayonza",
  "districtId": "...",
  "population": 400000,
  "area_km2": 800,
  "population_density": "500.0",
  "currentFacilities": 4,
  "facilityBreakdown": {
    "hospitals": 1,
    "health_centers": 2,
    "clinics": 1
  },
  "totalCapacity": 150,
  "avgTravel": 45,
  "target": 30,
  "populationPerFacility": 100000,
  "gap_status": "UNDERSERVED",
  "bounds": {
    "minLat": -2.2,
    "maxLat": -1.6,
    "minLon": 29.8,
    "maxLon": 30.5
  }
}
```

### 3. Get Recommendations
```
POST /api/recommend
{
  "analysis": { ...analysis object from step 2... }
}

RESPONSE:
{
  "success": true,
  "analysis": { ...analysis object... },
  "recommendation": {
    "recommendations": [
      {
        "name": "District Clinic North",
        "lat": -1.97,
        "lon": 30.08,
        "type": "health_center",
        "justification": "Addresses northern underserved area",
        "estimated_impact": "Reduces avg travel time by ~8 minutes"
      },
      ...
    ],
    "summary": "Added 3 facilities to reduce travel time from 45 to 30 minutes"
  }
}
```

## Deployment Architecture

### Docker Compose
```
docker-compose.yml
├─ api service
│  ├─ Container: node:18-alpine
│  ├─ Build: ./backend
│  ├─ Port: 5000 → 5000
│  ├─ Env: SUPABASE_URL, OLLAMA_URL
│  └─ Depends on: ollama
│
├─ ollama service
│  ├─ Container: ollama/ollama
│  ├─ Port: 11434 → 11434
│  ├─ Volume: ollama-data
│  └─ Command: serve
│
└─ web service
   ├─ Container: nginx:alpine
   ├─ Build: ./frontend-react/frontend
   ├─ Port: 3000 → 3000
   └─ Depends on: api
```

### Cloud Deployment (Vercel + Render)
```
GitHub Repository
    │
    ├─► Vercel (Frontend)
    │   ├─ Trigger: Push to main
    │   ├─ Build: npm run build
    │   ├─ Output: dist/
    │   ├─ Hosting: Vercel CDN
    │   └─ URL: health-planner.vercel.app
    │
    └─► Render (Backend)
        ├─ Trigger: Push to main
        ├─ Build: npm install
        ├─ Start: npm start
        ├─ Hosting: Render servers
        └─ URL: health-planner.onrender.com

External Services:
├─ Supabase (Database)
│  └─ PostgreSQL + PostGIS
│
└─ Ollama (LLM)
   └─ Hosted on GCP VM or local server
```

## Security Architecture

```
Data Flow with Security

User's Browser
    ↓
[HTTPS Only]
    ↓
Frontend (Vercel)
    ├─ CORS headers checked
    ├─ REACT_APP_API_URL validated
    └─ No secrets in frontend code
    ↓
[HTTPS + CORS]
    ↓
Backend (Render/Cloud Run)
    ├─ Environment variables protected
    ├─ Input validation on all endpoints
    ├─ SQL injection protected (Supabase SDK)
    └─ Error messages sanitized
    ↓
[Service role key]
    ↓
Supabase Database
    ├─ Row Level Security (RLS) policies
    ├─ Authenticated user checks
    ├─ Data ownership verification
    └─ Audit logging
```

## Performance Optimization

```
Query Optimization:
├─ Spatial indexes on geometry columns
├─ Materialized views for aggregate stats
└─ Query result caching

Frontend Optimization:
├─ React lazy loading (React.lazy)
├─ Code splitting with Vite
├─ Tailwind PurgeCSS
├─ Leaflet tile layer caching
└─ Axios request deduplication

Backend Optimization:
├─ Connection pooling (Supabase)
├─ Request compression
├─ LLM response caching
└─ Database query optimization

Infrastructure:
├─ CDN for frontend assets
├─ Database connection pooling
└─ LLM local inference (no network latency)
```

---

**Summary**: Production-ready 3-tier architecture with spatial database, REST API, and interactive frontend. Scalable to production with cloud deployment options.
