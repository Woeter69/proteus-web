from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text
from sqlalchemy.sql import func
from backend.database import Base

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, unique=True, index=True, nullable=False) # Celery Task ID
    name = Column(String, index=True)
    user_email = Column(String, nullable=True)
    smiles = Column(String, nullable=False)
    status = Column(String, default="PENDING") # PENDING, PROGRESS, COMPLETED, FAILED
    
    # Configuration
    steps = Column(Integer, default=10000)
    count = Column(Integer, default=1)
    payload = Column(String, nullable=True)
    payload_count = Column(Integer, default=0)
    
    # Results (Paths to files)
    log_path = Column(String, nullable=True)
    data_path = Column(String, nullable=True)
    dump_path = Column(String, nullable=True)
    gif_path = Column(String, nullable=True)
    
    # Metrics
    rg_final = Column(Float, nullable=True) # Radius of Gyration
    energy_final = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
