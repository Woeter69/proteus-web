import sys
from pathlib import Path
import os

# Add necessary directories to sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
platform_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir))
sys.path.append(str(platform_dir))

from backend.celery_app import celery_app
try:
    from src import topology, simulation, analysis, visualization
except ImportError:
    topology = None
    simulation = None
    analysis = None
    visualization = None
    print("WARNING: 'src' folder not found. Simulation tasks will fail.")

from backend.database import SessionLocal
from backend.models import Simulation
from backend.email_service import send_simulation_complete_email

@celery_app.task(bind=True)
def run_simulation_task(self, smiles: str, name: str, steps: int = 10000, count: int = 1, 
                        payload: str = None, payload_count: int = 0, render: bool = False):
    """
    Celery task to run the full Proteus pipeline.
    """
    db = SessionLocal()
    task_id = self.request.id
    
    # Update DB to Running
    db_sim = db.query(Simulation).filter(Simulation.task_id == task_id).first()
    if db_sim:
        db_sim.status = "RUNNING"
        db.commit()
    
    # Handle Molecule Count
    full_smiles = ".".join([smiles] * count)
    
    # Handle Payload
    if payload:
        payload_full = ".".join([payload] * payload_count)
        full_smiles = f"{full_smiles}.{payload_full}"
    
    # Setup Paths
    # We use the 'output' directory in the project root
    base_dir = Path(__file__).resolve().parent.parent.parent
    output_dir = base_dir / "output" / name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    data_file = output_dir / "polymer.data"
    input_file = output_dir / "simulation.in"
    log_file = output_dir / "simulation.log"
    dump_file = output_dir / "trajectory.dump"
    gif_file = output_dir / "animation.gif"
    
    self.update_state(state='PROGRESS', meta={'status': 'Generating Topology'})
    
    # 1. Topology
    try:
        bond_params, angle_params = topology.generate_topology(full_smiles, data_file)
    except Exception as e:
        if db_sim:
            db_sim.status = "FAILED"
            db.commit()
            if db_sim.user_email:
                send_simulation_complete_email(db_sim.user_email, db_sim.name, db_sim.id, "FAILED")
        return {'status': 'Failed', 'error': f"Topology Generation Failed: {e}"}
        
    self.update_state(state='PROGRESS', meta={'status': 'Running Simulation'})

    # 2. Simulation Setup & Run
    try:
        simulation.generate_input_file(
            data_file, 
            input_file, 
            dump_file, 
            steps=steps,
            bond_params=bond_params,
            angle_params=angle_params
        )
        simulation.run_simulation(input_file, log_file)
    except Exception as e:
        if db_sim:
            db_sim.status = "FAILED"
            db.commit()
            if db_sim.user_email:
                send_simulation_complete_email(db_sim.user_email, db_sim.name, db_sim.id, "FAILED")
        return {'status': 'Failed', 'error': f"Simulation Failed: {e}"}
        
    self.update_state(state='PROGRESS', meta={'status': 'Analyzing Results'})

    # 3. Analysis
    rg_data = {}
    try:
        # We might want to capture the output of analysis
        # For now, just run it
        analysis.analyze_results(log_file)
    except Exception as e:
        if db_sim:
            db_sim.status = "FAILED"
            db.commit()
            if db_sim.user_email:
                send_simulation_complete_email(db_sim.user_email, db_sim.name, db_sim.id, "FAILED")
        return {'status': 'Failed', 'error': f"Analysis Failed: {e}"}

    # 4. Visualization (Optional)
    if render:
        self.update_state(state='PROGRESS', meta={'status': 'Rendering Visualization'})
        try:
            visualization.render_trajectory(dump_path=dump_file, output_gif=gif_file)
        except Exception as e:
            if db_sim:
                db_sim.status = "FAILED" # Or partial success?
                db.commit()
            return {'status': 'Failed', 'error': f"Visualization Failed: {e}"}

    # Success! Update DB
    if db_sim:
        db_sim.status = "COMPLETED"
        db_sim.log_path = str(log_file)
        db_sim.dump_path = str(dump_file)
        if render:
            db_sim.gif_path = str(gif_file)
        db.commit()
        
        # Send Notification
        if db_sim.user_email:
            send_simulation_complete_email(db_sim.user_email, db_sim.name, db_sim.id, "COMPLETED")
    
    db.close()

    return {
        'status': 'Completed', 
        'output_dir': str(output_dir),
        'files': {
            'log': str(log_file),
            'gif': str(gif_file) if render else None
        }
    }
