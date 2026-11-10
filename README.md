# MARSWALK — Autonomous Mars Rover Mission Control & Navigation Intelligence

> **NASA Space Apps Challenge Entry**  
> An interactive mission control dashboard for autonomous rover pathfinding, energy-safety budgeting, and AI-driven terrain analysis over Jezero Crater DEM rasters.

---

## 📋 Overview

**MARSWALK** is a specialized mission-planning software engineered to simulate and evaluate rover traversal routes across high-resolution Digital Elevation Model (DEM) rasters of Mars (specifically the Jezero Crater region). 

Unlike heavy desktop GIS platforms, MARSWALK provides zero-friction web access, combining real-time kinematic calculations (slope risk, rover mass, drivetrain efficiency, battery thresholds) with deterministic graph-search pathfinding algorithms and LLM-assisted mission briefings.

---

## 🏛️ System Architecture

MARSWALK enforces a **strict architectural separation** between deterministic physical calculations and generative AI analysis:

                      ┌───────────────────────────┐
                      │ React Frontend (Vite)     │
                      │ - Interactive Map (Leaflet)│
                      │ - Telemetry Dashboards    │
                      └─────────────┬─────────────┘
                                    │ REST API
                                    ▼
                      ┌───────────────────────────┐
                      │   FastAPI Backend Server  │
                      └─────┬───────────────┬─────┘
                            │               │
                            ▼               ▼
        ┌───────────────────────┐       ┌───────────────────────┐
        │ Graph Search Engine   │       │  Gemini AI Engine     │
        │ - A* Search           │       │ - Mission Analysis    │
        │ - Dijkstra Algorithm  │       │ - Structured Report   │
        │ - Physical Kinematics │       │ - GO/NO-GO Narration  │
        └───────────────────────┘       └───────────────────────┘

1. **Deterministic Physics Engine (Python Backend):** Responsible for evaluating terrain matrices, executing graph traversal, calculating battery drain rates, enforcing maximum slope safety limits, and rendering final GO/NO-GO decisions.
2. **AI Mission Analyst (Gemini Integration):** Consumes structured numerical output from the backend to generate human-readable technical debriefings without hallucinatory risk over telemetry math.

---

## ⚡ Tech Stack

* **Frontend:** React.js, Vite, Tailwind CSS, Leaflet / Maplibre GL
* **Backend:** Python 3.11+, FastAPI, Uvicorn
* **Algorithms & Data Structures:** A* Search, Dijkstra Algorithm, Priority Queues, NumPy, Rasterio / GDAL
* **AI & Intelligence:** Google Gemini API (`google-genai` SDK)

---

## 🧮 Algorithms & Kinematic Models

### 1. Pathfinding Algorithms
* **A\* Search Algorithm:** Utilizes Euclidean and slope-weighted heuristic functions for optimal distance and safety paths across 2D DEM rasters.
* **Dijkstra’s Algorithm:** Evaluates uniform-cost path expansion across terrain grid nodes without heuristic bias to establish baseline traversal boundaries.

### 2. Multi-Strategy Rover Evaluation
The backend automatically computes and compares four simultaneous route strategies:
* **Shortest Route:** Optimizes strictly for minimum spatial distance.
* **Safest Route:** Minimizes maximum slope gradient along all raster segments.
* **Energy-Efficient Route:** Minimizes cumulative power consumption ($Wh$) accounting for ascent/descent dynamics.
* **Balanced Route:** Weighted cost-function balancing energy output and slope exposure.

### 3. Physical Kinematics Model
Energy calculations dynamically factor in:
* Rover Mass ($kg$) & Flat Terrain Power Baseline ($W$)
* Rolling Resistance Coefficient & Drivetrain Efficiency ($\eta$)
* Configured Slope Limit ($^\circ$) & Battery Safety Reserve ($20\%$ threshold)

---

## ⚙️ Installation & Local Setup

### Prerequisites
* Node.js (v18+)
* Python (v3.10+)
* Git

### 1. Clone the Repository
```bash
git clone [https://github.com/A-Shihab/MarsWalk.git](https://github.com/A-Shihab/MarsWalk.git)
cd MarsWalk

2. Backend Setup

# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows (cmd):
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file for API credentials
echo GEMINI_API_KEY=your_gemini_api_key_here > .env

# Start FastAPI server
uvicorn app.main:app --reload

Backend will run on http://127.0.0.1:8000.

3. Frontend Setup
# Open a new terminal and navigate to frontend directory
cd frontend

# Install packages
npm install

# Start local development server
npm run dev

Frontend will run on http://localhost:5173.

⚖️ License & Copyright
Copyright © 2026 Asaduzzaman Shihab. All Rights Reserved.

Developed specifically for the NASA Space Apps Challenge. No part of this software, including its architecture, code, and analytical models, may be reproduced, distributed, or modified without explicit written permission from the author.
