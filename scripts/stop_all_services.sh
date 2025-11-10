#!/bin/bash
# =============================================================================
# Healthcare Facility Finder - Stop All Services
# =============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Stopping all services...${NC}"
echo

# Function to stop a service
stop_service() {
    local name=$1
    local pid_file="logs/${name}.pid"

    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping ${name} (PID: ${pid})...${NC}"
            kill $pid
            sleep 1

            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${YELLOW}Force stopping ${name}...${NC}"
                kill -9 $pid
            fi

            echo -e "${GREEN}✅ ${name} stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  ${name} was not running${NC}"
        fi
        rm "$pid_file"
    else
        echo -e "${YELLOW}⚠️  No PID file for ${name}${NC}"
    fi
}

# Stop services in reverse order
stop_service "frontend"
stop_service "backend"
stop_service "ml-service"

# Clean up any remaining processes on these ports
echo
echo -e "${YELLOW}Checking for any remaining processes...${NC}"

# Kill processes on specific ports
for port in 3000 8080 5001; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
    fi
done

echo
echo -e "${GREEN}✅ All services stopped${NC}"
