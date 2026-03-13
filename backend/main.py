from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import sys
from pathlib import Path

# Add necessary directories to sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
platform_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir))
sys.path.append(str(platform_dir))

try:
    from src import topology
except ImportError:
    topology = None
    print("WARNING: 'src' folder not found. Simulation logic will be disabled.")

from backend.worker import run_simulation_task
from backend.database import SessionLocal, engine, get_db
from backend import models

from fastapi.staticfiles import StaticFiles

# Create Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Proteus API")

# Mount 'output' directory for static file serving
# Resolves to project root / output
output_dir = Path(__file__).resolve().parent.parent.parent / "output"
output_dir.mkdir(exist_ok=True) # Ensure it exists
app.mount("/files", StaticFiles(directory=str(output_dir)), name="files")

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationRequest(BaseModel):
    smiles: str
    name: str = "simulation"
    email: Optional[str] = None
    steps: int = 10000
    count: int = 1
    payload: Optional[str] = None
    payload_count: int = 0
    render: bool = False

@app.get("/")
def read_root():
    return {"message": "Proteus API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/simulate")
def trigger_simulation(request: SimulationRequest, db: Session = Depends(get_db)):
    """
    Trigger a new simulation task and store in database.
    """
    # 1. Start the Celery task
    task = run_simulation_task.delay(
        smiles=request.smiles,
        name=request.name,
        steps=request.steps,
        count=request.count,
        payload=request.payload,
        payload_count=request.payload_count,
        render=request.render
    )
    
    # 2. Save record to Database
    db_sim = models.Simulation(
        task_id=task.id,
        name=request.name,
        user_email=request.email,
        smiles=request.smiles,
        steps=request.steps,
        count=request.count,
        payload=request.payload,
        payload_count=request.payload_count,
        status="PENDING"
    )
    db.add(db_sim)
    db.commit()
    db.refresh(db_sim)
    
    return {"task_id": task.id, "id": db_sim.id, "status": "queued"}

@app.get("/api/simulations")
def list_simulations(db: Session = Depends(get_db)):
    """
    List all simulation jobs.
    """
    return db.query(models.Simulation).order_by(models.Simulation.created_at.desc()).all()

@app.get("/api/simulations/{sim_id}")
def get_simulation(sim_id: int, db: Session = Depends(get_db)):
    sim = db.query(models.Simulation).filter(models.Simulation.id == sim_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return sim

@app.get("/api/status/{task_id}")
def get_status(task_id: str, db: Session = Depends(get_db)):
    from celery.result import AsyncResult
    
    # Get status from Celery
    task_result = AsyncResult(task_id)
    
    # Sync with Database (optional but good for consistency)
    db_sim = db.query(models.Simulation).filter(models.Simulation.task_id == task_id).first()
    if db_sim and db_sim.status != task_result.status:
        db_sim.status = task_result.status
        db.commit()

    return {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result,
        "db_status": db_sim.status if db_sim else None
    }
