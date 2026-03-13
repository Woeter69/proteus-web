#!/bin/bash

# Move to the project directory
cd "$(dirname "$0")"

# Function to kill background processes on exit
cleanup() {
    echo "Stopping services..."
    kill $(jobs -p) 2>/dev/null
}

# Set up the trap to catch SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

echo "Installing/Updating Python dependencies..."
pip install -r backend/requirements.txt

echo "Starting Backend (FastAPI)..."
cd backend && uvicorn main:app --reload --port 8000 &

echo "Starting Frontend (Next.js)..."
cd ../frontend && npm run dev &

# Wait for all background processes
wait
