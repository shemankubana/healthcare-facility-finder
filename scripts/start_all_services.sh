#!/bin/bash
# =============================================================================
# Healthcare Facility Finder - Full Stack Startup Script
# =============================================================================
# This script starts all services in the correct order

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================================================${NC}"
echo -e "${BLUE}  Healthcare Facility Finder - Starting All Services${NC}"
echo -e "${BLUE}===============================================================================${NC}"
echo

# =============================================================================
# STEP 1: Check Prerequisites
# =============================================================================
echo -e "${YELLOW}[1/5] Checking Prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python not found. Please install Python 3.8+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python: $(python3 --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm: $(npm --version)${NC}"

echo

# =============================================================================
# STEP 2: Check Configuration
# =============================================================================
echo -e "${YELLOW}[2/5] Checking Configuration...${NC}"

# Check backend .env
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found, creating from .env.example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}   Please edit backend/.env with your Supabase credentials${NC}"
else
    echo -e "${GREEN}✅ backend/.env exists${NC}"
fi

# Check ML model
if [ ! -f "ml-service/models/healthcare_model.pkl" ]; then
    echo -e "${YELLOW}⚠️  ML model not found at ml-service/models/healthcare_model.pkl${NC}"
    echo -e "${YELLOW}   Options:${NC}"
    echo -e "${YELLOW}   1. Export from notebook (run the export cell in capstoneNotebook.ipynb)${NC}"
    echo -e "${YELLOW}   2. Run: python3 export_model.py (creates dummy model for testing)${NC}"
    echo
    read -p "   Create dummy model now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        python3 export_model.py
    else
        echo -e "${RED}   ML service will not work without a model${NC}"
    fi
else
    file_size=$(du -h "ml-service/models/healthcare_model.pkl" | cut -f1)
    echo -e "${GREEN}✅ ML model found (${file_size})${NC}"
fi

echo

# =============================================================================
# STEP 3: Install Dependencies
# =============================================================================
echo -e "${YELLOW}[3/5] Installing Dependencies...${NC}"

# Backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

# Frontend dependencies
if [ ! -d "frontend-react/frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend-react/frontend && npm install && cd ../..
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

# ML service dependencies
if [ ! -f "ml-service/.venv/bin/activate" ]; then
    echo "📦 Installing ML service dependencies..."
    cd ml-service
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
else
    echo -e "${GREEN}✅ ML service dependencies already installed${NC}"
fi

echo

# =============================================================================
# STEP 4: Start Services
# =============================================================================
echo -e "${YELLOW}[4/5] Starting Services...${NC}"
echo

# Create log directory
mkdir -p logs

# Function to start a service in background
start_service() {
    local name=$1
    local command=$2
    local port=$3

    echo -e "${BLUE}🚀 Starting ${name} on port ${port}...${NC}"
    eval "$command > logs/${name}.log 2>&1 &"
    local pid=$!
    echo $pid > "logs/${name}.pid"

    # Wait a moment for service to start
    sleep 2

    # Check if process is still running
    if ps -p $pid > /dev/null; then
        echo -e "${GREEN}✅ ${name} started (PID: ${pid})${NC}"
    else
        echo -e "${RED}❌ ${name} failed to start. Check logs/${name}.log${NC}"
    fi
}

# Start ML Service (Port 5001)
start_service "ml-service" "cd ml-service && source .venv/bin/activate && uvicorn app.main:app --port 5001" "5001"

# Start Backend (Port 8080)
start_service "backend" "cd backend && npm start" "8080"

# Start Frontend (Port 3000)
start_service "frontend" "cd frontend-react/frontend && npm start" "3000"

echo

# =============================================================================
# STEP 5: Health Checks
# =============================================================================
echo -e "${YELLOW}[5/5] Running Health Checks...${NC}"
sleep 5  # Wait for services to fully start

# Check ML Service
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ML Service is responding${NC}"
else
    echo -e "${YELLOW}⚠️  ML Service health check failed (may still be starting)${NC}"
fi

# Check Backend
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (may still be starting)${NC}"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend health check failed (may still be starting)${NC}"
fi

echo
echo -e "${BLUE}===============================================================================${NC}"
echo -e "${GREEN}✅ All Services Started!${NC}"
echo -e "${BLUE}===============================================================================${NC}"
echo
echo -e "${BLUE}📊 Service URLs:${NC}"
echo -e "   Frontend:   ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend:    ${GREEN}http://localhost:8080${NC}"
echo -e "   ML Service: ${GREEN}http://localhost:5001${NC}"
echo
echo -e "${BLUE}📁 Log Files:${NC}"
echo -e "   logs/frontend.log"
echo -e "   logs/backend.log"
echo -e "   logs/ml-service.log"
echo
echo -e "${BLUE}🛑 To stop all services:${NC}"
echo -e "   ./stop_all_services.sh"
echo
echo -e "${BLUE}===============================================================================${NC}"
