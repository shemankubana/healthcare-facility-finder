# Healthcare Facility Planner - Quick Start Guide

Get up and running in 10 minutes.

## 1. Clone & Setup

```bash
# Navigate to project directory (already done)
cd /path/to/project
```

## 2. Configure Supabase

Create a `.env` file in the `backend/` directory:

```
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
PORT=5000
NODE_ENV=development
```

**Get these from:** [supabase.io](https://supabase.io) dashboard → Settings → API

## 3. Start the Backend

```bash
cd backend
npm install
npm run dev
```

✓ Server running at `http://localhost:5000`

## 4. Start the Frontend

```bash
cd frontend-react/frontend
npm install

# Create .env
echo "REACT_APP_API_URL=http://localhost:5000" > .env

npm start
```

✓ App running at `http://localhost:3000/planner`

## 5. Start Ollama (Optional - for AI recommendations)

```bash
# Install from https://ollama.ai, then:

ollama pull mistral

# In another terminal:
ollama serve
```

✓ LLM API running at `http://localhost:11434`

## 6. Use the App

1. Go to http://localhost:3000/planner
2. Select "Kayonza" district
3. Set target travel time to 30 minutes
4. Click "Analyze District"
5. Click "Get Recommendations"
6. View AI-suggested facility locations on the map

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "SUPABASE_URL not found" | Add env vars to `backend/.env` |
| Cannot connect to API | Ensure backend is running on 5000 |
| LLM not working | Install Ollama and run `ollama serve` |
| Port 5000 already in use | Kill process: `lsof -i :5000` then `kill -9 <PID>` |
| Frontend blank screen | Check browser console for errors (F12) |

## Full Setup Details

See [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for detailed documentation.

## Architecture

```
User Browser
    ↓
[React App] ← API Calls → [Express API]
                                 ↓
                         [Supabase (PostGIS)]
                                 ↓
                          [Ollama LLM]
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/districts` - List districts
- `GET /api/analyze?district=Kayonza&targetTravel=30` - Analyze accessibility
- `POST /api/recommend` - Get AI recommendations

## Next: Deploy

Ready to deploy? Check deployment options in SETUP_INSTRUCTIONS.md:
- Docker Compose (local/server)
- Vercel + Render (cloud)
- GCP Cloud Run

## Need Help?

1. Check server logs (backend terminal)
2. Check browser console (F12 → Console tab)
3. Verify Supabase connection in dashboard
4. Ensure all ports are open (5000, 3000, 11434)
