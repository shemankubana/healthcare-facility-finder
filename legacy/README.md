# Legacy Code

This directory contains deprecated code that is no longer used in the project.

## Files

### app.py (Flask Backend)
**Status**: DEPRECATED - Not used in production

This was an experimental Flask-based backend with:
- Mock data endpoints for accessibility analysis
- ML model loading functionality (models never created)
- Satellite imagery upload endpoints
- Different API structure than current Express backend

**Why deprecated**:
The project standardized on the Express.js backend (`/backend/server.js`) which has:
- Real Supabase/PostgreSQL integration
- Actual geospatial data with PostGIS
- Production-ready authentication
- Active development and maintenance

**Current Backend**: Use `/backend/server.js` (Express.js)

Do not use this Flask app for new development. It is kept here for historical reference only.
