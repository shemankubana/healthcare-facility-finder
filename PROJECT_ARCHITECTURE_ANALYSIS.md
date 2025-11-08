# Healthcare Facility Finder - Comprehensive Architecture Analysis

**Analysis Date:** November 8, 2025
**Project Status:** Active Development
**Current Branch:** claude/analyze-th-011CUthj63apkXNwkqZwJgDh

---

## EXECUTIVE SUMMARY

The Healthcare Facility Finder is a full-stack application designed to help policymakers in Rwanda identify optimal locations for new healthcare facilities using satellite imagery analysis, geospatial data, and AI recommendations. The project has a **solid architectural foundation** with Express.js backend, React frontend, FastAPI ML service, and Supabase database, but has several **critical issues that break production readiness**.

**Overall Health Score: 6/10**
- ✅ Architecture is well-designed
- ✅ ML pipeline is integrated
- ✅ Documentation is comprehensive
- ❌ Critical port mismatch issues
- ❌ Missing ML model file blocks functionality
- ❌ Configuration inconsistencies

---

## 1. SERVICE ARCHITECTURE

### 1.1 Overall System Design

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Tier                          │
│  React 18 (Port 3000)                                       │
│  - Leaflet Maps                                             │
│  - Tailwind CSS UI                                          │
│  - Supabase Auth Integration                                │
└────────────────────┬────────────────────────────────────────┘
                     │ (REACT_APP_API_URL)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend Tier (Express.js)                 │
│  Port: 8080 (configured in docker-compose)                 │
│  Port: 5000 (documented in README & hardcoded in frontend) │
│                                                              │
│  Routes:                                                    │
│  ├── /api/districts      - Get all districts               │
│  ├── /api/analyze        - Analyze district accessibility  │
│  ├── /api/recommend      - Generate AI recommendations      │
│  ├── /api/users          - User approval workflow           │
│  ├── /api/ml/*           - ML service proxy                │
│  └── /api/health         - Health check                     │
└────────────┬────────────────────┬──────────────────────────┘
             │                    │
             ▼                    ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ PostgreSQL DB    │  │ Ollama LLM       │
    │ (Supabase)       │  │ (Port 11434)     │
    │ - PostGIS        │  │ - mistral model  │
    │ - RLS policies   │  │                  │
    └──────────────────┘  └──────────────────┘
             │
             ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ ML Service       │  │ Google Earth     │
    │ FastAPI (5001)   │  │ Engine API       │
    │ - Predictions    │  │ - Satellite data │
    │ - Feature extract│  │ - Sentinel-2     │
    └──────────────────┘  └──────────────────┘
```

### 1.2 Service Details

#### Backend Service (Express.js)
- **Port:** 8080 (production), 5000 (hardcoded fallback in some frontend files)
- **Status:** ✅ Running, fully integrated
- **Key Files:**
  - `/backend/server.js` - Express app entry point
  - `/backend/routes/` - API endpoints
  - `/backend/services/llm.js` - Ollama integration
  - `/backend/lib/supabase.js` - Database client

#### Frontend Service (React)
- **Port:** 3000
- **Status:** ⚠️ Has API URL mismatch issues
- **Key Files:**
  - `/frontend-react/frontend/src/pages/HealthFacilityPlanner.jsx`
  - `/frontend-react/frontend/src/lib/api.js`
  - `/frontend-react/frontend/src/components/admin/adminDashboard.jsx`

#### ML Service (FastAPI)
- **Port:** 5001
- **Status:** ✅ Code complete, but **model file missing**
- **Key Files:**
  - `/ml-service/app/main.py` - FastAPI server
  - `/ml-service/app/model_loader.py` - Model management
  - `/ml-service/app/feature_extractor.py` - Satellite imagery processing

#### Database (Supabase/PostgreSQL)
- **Status:** ✅ Schema created with migrations
- **Key Tables:**
  - `districts` - Rwanda districts with PostGIS geometry
  - `health_facilities` - Existing hospitals, health centers, clinics
  - `population_cells` - Population density with travel times
  - `recommendations` - Stored analysis results
  - `signup_requests` - User approval workflow
  - `user_profiles` - User management

#### LLM Service (Ollama)
- **Port:** 11434
- **Status:** ✅ Integrated in docker-compose
- **Model:** mistral (configurable)

---

## 2. CRITICAL ISSUES & BREAKING POINTS

### ❌ ISSUE 1: Frontend API URL Port Mismatch (HIGH SEVERITY)

**Problem:** Multiple frontend files hardcode API URL with port 5000, but backend runs on 8080

**Affected Files:**
```
✗ /frontend-react/frontend/src/pages/HealthFacilityPlanner.jsx:8
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  
✗ /frontend-react/frontend/src/lib/api.js:3
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

✓ /frontend-react/frontend/src/components/admin/adminDashboard.jsx (uses 8080)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
```

**Impact:**
- Frontend can't connect to backend by default
- Only works if REACT_APP_API_URL is explicitly set to 8080
- Breaks for new developers following standard setup

**Documentation Inconsistencies:**
- README.md shows port 5000
- SETUP_GUIDE.md shows port 5000
- .env.template shows port 5000
- docker-compose.yml shows port 8080 ✓
- .env.example in frontend shows port 8080 ✓

---

### ❌ ISSUE 2: Missing ML Model File (HIGH SEVERITY)

**Problem:** ML service expects trained model at `/ml-service/models/healthcare_model.pkl` but it doesn't exist

**Current Status:**
```
$ ls -la /ml-service/models/
-rw-r--r-- 1 root root 5961 Nov  7 16:04 README.md
# NO .pkl file!
```

**Impact:**
- ML service fails to start/initialize on container startup
- Health check fails: `model_loaded: false`
- Endpoints `/api/ml/predict*` return 503 errors
- Feature not functional despite being fully integrated

**Expected File Structure:**
```python
{
    'model': RandomForestClassifier instance,
    'scaler': StandardScaler instance (CRITICAL - must match training),
    'version': '1.0.0',
    'accuracy': 0.99
}
```

**How to Fix:**
1. Run `capstoneNotebook.ipynb` cells 1-40 (training pipeline)
2. Export model using script in `/export_model_from_notebook.py`
3. Copy to `ml-service/models/healthcare_model.pkl`

**Note:** File is .gitignored for security (appropriate) but deployment pipeline missing

---

### ❌ ISSUE 3: Configuration Inconsistencies (MEDIUM SEVERITY)

**Problem:** Multiple environment files give conflicting information

```
FILE                          | PORT  | STATUS
──────────────────────────────┼───────┼─────────
.env.template                 | 5000  | ✗ Wrong
.env.example                  | N/A   | ✗ Missing
backend/.env.example          | 8080  | ✓ Correct
frontend/.env.example         | 8080  | ✓ Correct
docker-compose.yml            | 8080  | ✓ Correct
README.md (examples)          | 5000  | ✗ Wrong
SETUP_GUIDE.md                | 5000  | ✗ Wrong
ML_INTEGRATION_GUIDE.md       | 8080  | ✓ Correct
```

---

### ⚠️ ISSUE 4: Incomplete API Endpoint Implementation

**Missing Endpoints Called by Frontend:**
```javascript
// In /frontend-react/frontend/src/lib/api.js
✗ api.get('/api/accessibility')        // Not implemented in backend
✗ api.get('/api/predictions')          // Not implemented in backend
✗ api.post('/api/analyze-region')      // Not implemented (wrong name?)
✗ api.post('/api/upload-satellite')    // Not implemented
```

**Actually Implemented:**
```
✓ GET  /api/health
✓ GET  /api/districts
✓ GET  /api/districts/:id
✓ GET  /api/analyze?district=X&targetTravel=Y
✓ POST /api/recommend
✓ GET  /api/recommend/history/:districtId
✓ POST /api/users/approve
✓ POST /api/users/reject
✓ GET  /api/users/requests
✓ GET  /api/ml/health
✓ GET  /api/ml/model/info
✓ POST /api/ml/predict
✓ POST /api/ml/predict-location
✓ POST /api/ml/predict-batch
```

**Impact:** Frontend error handling won't work for unimplemented endpoints

---

### ⚠️ ISSUE 5: Supabase Service Role Key Not Configured (MEDIUM SEVERITY)

**Problem:** User approval requires `SUPABASE_SERVICE_ROLE_KEY` but may not be set

**Code Location:** `/backend/lib/supabase.js:19-29`
```javascript
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {...})
  : null;

if (!supabaseAdmin) {
  console.warn("⚠️  SUPABASE_SERVICE_ROLE_KEY not configured...");
}
```

**Impact:**
- User approval workflow returns 500 error if key not set
- Admin dashboard becomes non-functional
- Message tells user what's missing (good error handling)

**Required Setup:**
- Get key from Supabase dashboard: Settings → API → Service role secret
- Add to `backend/.env`: `SUPABASE_SERVICE_ROLE_KEY=...`

---

## 3. WHAT EXISTS & WORKS WELL

### ✅ Fully Implemented Features

1. **District Analysis Endpoint**
   - Dynamically fetches district bounds using PostGIS
   - Calculates population, facilities, travel times
   - Returns structured analysis data
   - Good error handling with fallbacks

2. **ML Service Infrastructure**
   - Complete FastAPI application
   - Model loader with StandardScaler preprocessing
   - Feature extractor for Sentinel-2 imagery
   - Batch prediction support
   - Comprehensive error handling
   - Docker integration with health checks

3. **Recommendation System**
   - Ollama LLM integration
   - JSON-structured prompts
   - Fallback hardcoded recommendations
   - Database storage of recommendations
   - Handles LLM errors gracefully

4. **User Management**
   - Signup request system
   - User approval workflow
   - Supabase Auth integration
   - Admin role verification
   - Service role elevation for admin operations

5. **Database Schema**
   - PostGIS geometry support
   - Row-level security (RLS) policies
   - Proper indices on geometric data
   - Migration system in place
   - Geospatial queries working

6. **Documentation**
   - Comprehensive ML integration guides
   - Setup instructions
   - API documentation
   - Architecture diagrams
   - Model export procedures

---

## 4. CONNECTION FLOW ANALYSIS

### Data Flow: Working ✅

```
Browser Request
    ↓
React Frontend (Port 3000)
    ↓
Express Backend (Port 8080 or 5000 depending on config)
    ↓
┌─────────────────────────────────────────┐
│ Route Handler                           │
│ ├─ /api/analyze                         │
│ │  ├─ Query: SELECT * FROM districts   │
│ │  ├─ Query: SELECT * FROM facilities  │
│ │  └─ Return: Analysis JSON            │
│ │                                       │
│ ├─ /api/recommend                       │
│ │  ├─ Call: POST to Ollama 11434       │
│ │  ├─ Process: Extract JSON response   │
│ │  └─ Store: INSERT to recommendations │
│ │                                       │
│ └─ /api/ml/* (if enabled)              │
│    ├─ Check: ML_ENABLED=true           │
│    ├─ Proxy: POST to ML Service:5001   │
│    └─ Return: Predictions              │
└─────────────────────────────────────────┘
    ↓
Supabase/PostgreSQL (with PostGIS)
    ↓
Response back to Frontend
```

**Problem:** If `REACT_APP_API_URL` not set, port 5000 is used instead of 8080 → Connection fails

---

## 5. ML INTEGRATION DETAILS

### Model Training Pipeline
Located in: `/capstoneNotebook.ipynb` (45 code cells)

**Data Source:** Sentinel-2 satellite imagery via Google Earth Engine
- Bands: Red (B4), Green (B3), Blue (B2), NIR (B8)
- Date range: 2025-01-01 to 2025-09-30
- Region: Rwanda

**Feature Engineering:**
```
12-dimensional feature vector:
1.  R_mean   (Red band mean)
2.  R_std    (Red band std dev)
3.  G_mean   (Green band mean)
4.  G_std    (Green band std dev)
5.  B_mean   (Blue band mean)
6.  B_std    (Blue band std dev)
7.  NDVI_mean    (Normalized Difference Vegetation Index)
8.  NDVI_std
9.  Built_mean   (Built-up Index)
10. Built_std
11. Brightness_mean  (RGB average)
12. Brightness_std
```

**Model:** Random Forest Classifier
- Trained on Sentinel-2 image patches
- Binary classification: Built-up (1) vs Non-built (0)
- Used for detecting healthcare facility locations
- Feature scaling: StandardScaler (REQUIRED for inference)

### ML Service Endpoints

```
GET /health
  Response: { status, model_loaded, gee_available }

GET /api/model/info
  Response: Model metadata, accuracy, feature names

POST /api/predict
  Body: { features: [12 floats] }
  Response: { prediction: 0|1, probability: 0.0-1.0, confidence: low|medium|high }

POST /api/predict-from-location
  Body: { latitude, longitude, patch_size, date_start, date_end }
  Response: Prediction from GEE imagery (requires GEE auth)

POST /api/predict-batch
  Body: { requests: [{ features: [...] }, ...] }
  Response: Array of predictions
```

---

## 6. API ENDPOINT MAPPING

### Implemented Endpoints

| Method | Path | Backend | Status | Purpose |
|--------|------|---------|--------|---------|
| GET | `/api/health` | ✓ | Working | System status |
| GET | `/api/districts` | ✓ | Working | List all districts |
| GET | `/api/districts/:id` | ✓ | Working | Get specific district |
| GET | `/api/analyze` | ✓ | Working | Analyze district accessibility |
| POST | `/api/recommend` | ✓ | Depends on Ollama | Generate recommendations |
| GET | `/api/recommend/history/:districtId` | ✓ | Working | Recommendation history |
| POST | `/api/users/approve` | ✓ | Needs service role key | Approve user signup |
| POST | `/api/users/reject` | ✓ | Needs service role key | Reject user signup |
| GET | `/api/users/requests` | ✓ | Needs auth token | List signup requests |
| GET | `/api/ml/health` | ✓ | Needs model file | ML service status |
| GET | `/api/ml/model/info` | ✓ | Needs model file | Model metadata |
| POST | `/api/ml/predict` | ✓ | Needs model file | ML predictions |
| POST | `/api/ml/predict-location` | ✓ | Needs GEE + model | Location-based ML |
| POST | `/api/ml/predict-batch` | ✓ | Needs model file | Batch predictions |

### Not Implemented (Frontend calls but no backend)

| Method | Path | Reason | Impact |
|--------|------|--------|--------|
| GET | `/api/accessibility` | No handler | Frontend fails silently |
| GET | `/api/predictions` | No handler | Frontend fails silently |
| POST | `/api/analyze-region` | Wrong name (should be `/api/analyze`) | Frontend gets wrong data |
| POST | `/api/upload-satellite` | Not implemented | Upload feature broken |

---

## 7. DATABASE SCHEMA

### Tables & Key Relationships

```sql
districts
├── id (UUID, PK)
├── name (TEXT, UNIQUE)
├── geom (MultiPolygon with PostGIS)
├── population (BIGINT)
├── area_km2 (NUMERIC)
└── created_at (TIMESTAMPTZ)

health_facilities
├── id (UUID, PK)
├── name (TEXT)
├── type (hospital | health_center | clinic)
├── capacity (INTEGER)
├── services (TEXT[])
├── geom (Point with PostGIS)
├── district_id (UUID, FK → districts)
├── created_at, updated_at
└── INDEX: ON district_id, geom (GIST)

population_cells
├── id (UUID, PK)
├── geom (Polygon with PostGIS)
├── pop_estimate (NUMERIC)
├── avg_travel_min (NUMERIC)
├── district_id (UUID, FK → districts)
└── created_at

recommendations
├── id (UUID, PK)
├── district_id (UUID, FK → districts)
├── user_id (UUID)
├── target_travel_min (NUMERIC)
├── analysis_input (JSONB)
├── recommendation_output (JSONB)
└── created_at

signup_requests
├── id (UUID, PK)
├── email (TEXT, UNIQUE)
├── first_name, last_name (TEXT)
├── role (TEXT)
├── status (pending | approved | rejected)
├── approved_by (UUID)
├── approved_at (TIMESTAMPTZ)
└── created_at, updated_at

user_profiles
├── id (UUID, PK)
├── email (TEXT)
├── first_name, last_name
├── role (TEXT)
├── is_admin (BOOLEAN)
├── approval_status
└── created_at
```

**Key Features:**
- PostGIS geometry support for spatial queries
- Row-level security (RLS) policies
- Indices on foreign keys and geometry columns
- Dynamic bounds calculation via `get_district_bounds()` function

---

## 8. ENVIRONMENT CONFIGURATION

### Required Environment Variables

**Backend (.env)**
```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Required for user approval

# LLM
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=mistral

# Server
PORT=8080
NODE_ENV=production

# ML Service
ML_ENABLED=true
ML_SERVICE_URL=http://ml-service:5001
```

**Frontend (.env)**
```bash
REACT_APP_API_URL=http://localhost:8080
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
```

**ML Service (.env)**
```bash
MODEL_PATH=/app/models/healthcare_model.pkl
ML_SERVICE_PORT=5001
LOG_LEVEL=INFO
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gee-credentials.json
```

---

## 9. MISSING OR BROKEN COMPONENTS

### Critical Gaps

| Component | Status | Impact | Fix |
|-----------|--------|--------|-----|
| ML Model File | ❌ Missing | ML service non-functional | Export from notebook |
| Port Configuration | ⚠️ Inconsistent | Frontend can't connect by default | Standardize to 8080 |
| Frontend API URLs | ⚠️ Wrong defaults | Breaks new developer setup | Update hardcoded ports |
| Supabase Service Key | ⚠️ Optional | User approval broken if not set | Configure in .env |
| Documentation | ⚠️ Outdated | Guides show wrong ports | Update to 8080 |
| Unimplemented endpoints | ✓ Documented | Frontend has fallbacks | Implement or remove from frontend |

### Known Limitations

1. **No Automated Testing**
   - No unit tests for backend routes
   - No integration tests
   - No ML model tests

2. **No CI/CD Pipeline**
   - Manual deployment required
   - No automated health checks
   - No staging environment

3. **No Monitoring/Logging**
   - Basic console.error logging
   - No log aggregation
   - No performance metrics

4. **Limited Sample Data**
   - Only 4 districts in sample data
   - Needs full Rwanda coverage (30 districts)
   - Population cells incomplete

5. **No Rate Limiting**
   - API endpoints unprotected
   - Potential DoS vulnerability
   - No quota management

6. **No Error Recovery**
   - Ollama unavailable breaks /api/recommend
   - GEE failure returns null silently
   - No retry logic

---

## 10. ARCHITECTURE STRENGTHS

### Well-Designed Aspects

1. **Separation of Concerns**
   - Frontend (React) isolated from backend
   - ML service as separate microservice
   - Database abstraction via Supabase

2. **Microservice Architecture**
   - Express backend independent
   - FastAPI ML service separate
   - Ollama LLM pluggable
   - Docker Compose orchestration

3. **Database Design**
   - PostGIS for geospatial queries
   - Proper foreign key relationships
   - Row-level security implemented
   - Indices on hot queries

4. **Error Handling**
   - User approval has graceful fallbacks
   - LLM errors don't crash system
   - District bounds fallback to Rwanda defaults
   - ML service returns appropriate HTTP status codes

5. **Documentation**
   - Multiple guides (Setup, ML Integration, Admin)
   - API examples with curl
   - Architecture diagrams
   - Model export instructions

---

## 11. RECOMMENDATIONS & NEXT STEPS

### Immediate (Before Going to Production)

1. **Fix Port Configuration** (CRITICAL)
   ```bash
   # Update all hardcoded ports to 8080
   frontend/src/pages/HealthFacilityPlanner.jsx:8
   frontend/src/lib/api.js:3
   
   # Update documentation
   README.md (all examples)
   SETUP_GUIDE.md (all examples)
   .env.template
   ```

2. **Export ML Model** (CRITICAL)
   ```bash
   # Run notebook cells 1-40
   # Execute export cell
   # Verify file exists: ml-service/models/healthcare_model.pkl
   ```

3. **Configure Supabase** (HIGH)
   ```bash
   # Get keys from Supabase dashboard
   # Set in backend/.env:
   SUPABASE_URL
   SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   
   # Run migrations
   supabase migration up
   ```

4. **Test Full Stack** (HIGH)
   ```bash
   docker-compose up -d
   # Verify all services start
   # Test /api/health endpoints
   # Test district analysis flow
   # Test recommendation generation
   ```

### Short-term (Next Sprint)

1. **Implement Missing Endpoints**
   - Remove unused frontend API calls, OR
   - Implement missing backend endpoints
   - Clarify API contract

2. **Add Automated Tests**
   - Backend route tests
   - Frontend component tests
   - ML service unit tests
   - Integration tests

3. **Set Up CI/CD**
   - GitHub Actions workflow
   - Automated testing on PR
   - Docker image building
   - Automated deployment

4. **Add Monitoring**
   - Prometheus metrics
   - Error tracking (Sentry)
   - Logging aggregation
   - Uptime monitoring

### Medium-term (Next Month)

1. **Expand Data Coverage**
   - Load all 30 Rwanda districts
   - Complete population cell data
   - Add more facility data

2. **Performance Optimization**
   - Database query optimization
   - Frontend code splitting
   - ML inference caching

3. **Security Hardening**
   - Rate limiting on API
   - Input validation
   - CORS configuration review
   - SQL injection prevention (Supabase handles)

4. **Deployment**
   - Cloud deployment (GCP, AWS, Azure)
   - Load balancing
   - Database backups
   - Disaster recovery

---

## 12. POTENTIAL SECURITY ISSUES

### Low Risk
- API endpoints are public (intentional for demo)
- No sensitive data in hardcoded configs

### Medium Risk
- No rate limiting on endpoints
- ML model file has special privileges (acceptable)
- GEE credentials in container (use secrets management)

### Action Items
1. Add rate limiting middleware
2. Use environment-based credential injection
3. Add request validation
4. Implement CORS restrictions for production

---

## CONCLUSION

The Healthcare Facility Finder has a **solid foundation** with well-architected microservices, comprehensive ML integration, and good database design. However, it has **3 critical issues** blocking production deployment:

1. **Port mismatch** - Frontend hardcoded to port 5000, backend on 8080
2. **Missing ML model file** - ML service can't start
3. **Configuration inconsistencies** - Documentation vs actual implementation

These are all **easily fixable** and once addressed, the system should be production-ready. The code quality is good, error handling is thoughtful, and the architecture is scalable.

**Estimated fix time:** 2-4 hours
**Estimated full testing:** 1-2 days
**Estimated production deployment:** 1 week (with monitoring setup)

---

**Generated:** 2025-11-08
**Analysis Tool:** Claude Code
**Status:** Ready for review and implementation
