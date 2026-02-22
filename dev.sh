#!/bin/bash

# Move to the platform directory
cd "$(dirname "$0")"

# Function to kill background processes on exit
cleanup() {
    echo "Stopping services..."
    kill $(jobs -p) 2>/dev/null
}

# Set up the trap to catch SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

echo "Updating Conda Environment..."
conda env update --file ../environment.yml --prune

echo "Starting Backend (FastAPI)..."
cd backend && conda run --no-capture-output -n proteus_env uvicorn main:app --reload --port 8000 &

echo "Starting Frontend (Next.js)..."
cd ../frontend && npm run dev &

# Wait for all background processes
wait
