# Proteus Web Platform: Integration & UX Guide

This document is the authoritative guide for connecting the **Proteus CLI Core** to the **Web Platform**. It defines the API architecture, data flow, and UX/UI principles required for a seamless research experience.

---

## 1. High-Level Architecture
The web platform follows a distributed, asynchronous architecture to handle long-running Molecular Dynamics (MD) simulations.

- **Frontend**: Next.js 14+ (App Router, TypeScript, Tailwind CSS).
- **Backend**: FastAPI (Python) serving as the API Gateway.
- **Task Queue**: Celery with Redis for asynchronous job processing.
- **Database**: PostgreSQL (Production) or SQLite (Local Dev).
- **Core Engine**: The Proteus CLI (`main.py` and `src/`).

---

## 2. API & Data Flow
### Job Submission
1. **Frontend**: The user submits a SMILES string and simulation parameters via a `SimulationRequest` form.
2. **Backend**: `POST /api/simulate`
    - Validates inputs (SMILES via RDKit).
    - Creates a `Simulation` record in the database with status `PENDING`.
    - Dispatches a task to the Celery worker: `run_simulation_task.delay(sim_id)`.
3. **Worker**:
    - Updates status to `RUNNING`.
    - Invokes the Proteus CLI: `python main.py --smiles <SMILES> --name <ID> --steps <STEPS> ...`.
    - Captures the `output/<ID>/` directory.
    - On completion: Parses `simulation.log` for $R_g$ and updates database status to `COMPLETED`.

### Result Retrieval
- **Status Polling**: `GET /api/simulation/{id}` returns current status and metrics.
- **File Serving**: Resulting assets (GIFs, Plots, Data files) are served via a static files endpoint (e.g., `/files/{id}/animation.gif`).

---

## 3. UX & UI Principles (The "Proteus Look")
### Visual Aesthetic
- **Theme**: "Dark Atmospheric" / "Black & Glowy".
- **Hero Component**: The **Iridescent Reactor** (A 3D Triple-Nested Tesseract).
    - Outer refractive glass shell with rainbow dispersion.
    - Glowy white outlines (`<Edges />`).
    - Black base color for sharp star reflections.
- **Interaction**: High-intensity HDR outlines and Bloom post-processing for a futuristic laboratory feel.

### Core UX Mandates
- **Optionality (The Payload Rule)**: Advanced features like "The Payload" (Drug Encapsulation) must be **strictly optional**. Never force these parameters on the user in the UI; hide them behind "Advanced" toggles.
- **User Control**: Provide clear feedback for long-running jobs. Use the streaming output logic from the CLI to provide real-time log snippets in the UI.
- **Visual Clarity**: Atom visualizations should use element-specific radii (CHONS) and color-coding by Molecule ID to clearly distinguish the polymer from the payload.

---

## 4. Key Simulation Variables
The web UI must expose these variables (refer to `VARIABLES.md` for full details):

| Category | Variables to Expose |
| :--- | :--- |
| **Input** | `smiles`, `count`, `payload`, `payload_count` |
| **Physics** | `temp`, `damp`, `timestep`, `steps`, `gpus` |
| **Optimization** | `padding`, `epsilon`, `sigma` |
| **Visualization** | `render` (GIF toggle), `plot` (Stability graph) |

---

## 5. Integration Hooks for Sub-Agents
When building or modifying the web components, ensure:
1. **API Alignment**: Any change to `main.py` arguments must be reflected in the FastAPI `SimulationRequest` schema.
2. **Environment**: Use `.env` for `DATABASE_URL`, `REDIS_URL`, and Email settings.
3. **Asset Paths**: The frontend should use relative paths for results to ensure compatibility with Nginx proxies.
4. **Error Handling**: Bubble up CLI errors (e.g., "Invalid SMILES") to the frontend notification system.

---
**Status:** This file is the bridge between the Core CLI repository and the Web Platform repository.
