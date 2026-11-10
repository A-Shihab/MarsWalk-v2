# 🚀 MARSWALK — Autonomous Mars Rover Mission Control & Navigation Intelligence

> **NASA Space Apps Challenge Project**  
> An interactive Mars rover mission-planning and terrain intelligence platform combining DEM-based navigation, rover energy estimation, multi-strategy route comparison, and U-Net-powered AI terrain classification.

---

## 📋 Overview

**MARSWALK** is a web-based Mars terrain intelligence and rover mission-planning platform designed to simulate and evaluate rover navigation across the Jezero Crater region of Mars.

The platform combines high-resolution Digital Elevation Model (DEM) data, terrain analysis, graph-search pathfinding algorithms, rover energy estimation, and deep-learning-based terrain classification in one interactive dashboard.

MARSWALK is designed to help users explore terrain conditions, plan rover missions, compare alternative navigation strategies, and understand potential terrain hazards through AI-assisted analysis.

The platform currently provides three main interactive modules:

1. **Mission Planner** — Plans rover missions using terrain information, navigation constraints, and energy estimates.
2. **Rover Route Planner** — Calculates and compares alternative navigation strategies, including shortest, safest, energy-efficient, and balanced routes.
3. **AI Terrain Intelligence** — Uses a trained U-Net segmentation model to classify terrain in rover-camera images.

---

## ✨ Key Features

### 1. Mission Planning

- Configure rover starting and destination coordinates.
- Generate a rover mission plan using Jezero Crater DEM data.
- Evaluate terrain slope and navigation constraints.
- Estimate rover energy consumption using configurable physical parameters.
- Evaluate estimated energy requirements against available battery capacity and safety reserve.
- Generate AI-assisted mission explanations using Google Gemini.

### 2. Intelligent Rover Route Planning

MARSWALK provides multiple route-planning strategies to help users compare different navigation approaches.

- **Shortest Route:** Prioritizes minimum travel distance.
- **Safest Route:** Prioritizes lower terrain slope exposure.
- **Energy-Efficient Route:** Prioritizes estimated energy consumption.
- **Balanced Route:** Combines navigation and energy-related cost considerations.

The route planner uses graph-search algorithms to explore traversable cells in the terrain raster.

### 3. AI Terrain Intelligence — U-Net Model

MARSWALK includes a trained **U-Net semantic segmentation model** for terrain classification.

The model was trained using AI4MARS rover-camera image data and is integrated into the backend to generate pixel-level terrain predictions.

**Terrain classes:**

| Class ID | Terrain Category |
|---|---|
| 0 | Soil |
| 1 | Bedrock |
| 2 | Sand |
| 3 | Big Rock |

**What users can do:**

- Submit a rover-camera image for analysis.
- Generate a pixel-level terrain segmentation mask.
- Identify different terrain categories within an image.
- Explore the predicted terrain distribution.
- Use the classification output as additional terrain intelligence.

**Important:** The U-Net model was trained using AI4MARS rover-camera imagery. Its predictions should not be interpreted as validated classification of Jezero Crater orbital imagery or as a flight-certified rover navigation system.

### 4. Gemini AI Mission Explanation

MARSWALK integrates Google's Gemini API to provide natural-language explanations of mission and navigation results.

The AI explanation layer can:

- Summarize mission-planning results.
- Explain route comparison outputs.
- Present technical findings in a more understandable format.
- Provide supporting mission briefings.

**Architectural principle:** Numerical terrain calculations, pathfinding, and energy estimates are performed by the backend. Gemini is used to explain structured results rather than replace deterministic calculations.

---

## 🏛️ System Architecture

MARSWALK follows a frontend-backend architecture that separates user interaction, numerical processing, AI inference, and language-model explanations.

```text
                    ┌──────────────────────────────┐
                    │       React Frontend         │
                    │                              │
                    │  Mission Planner             │
                    │  Rover Route Planner         │
                    │  AI Terrain Intelligence     │
                    │  Interactive Dashboard       │
                    └──────────────┬───────────────┘
                                   │
                              REST API
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │       FastAPI Backend        │
                    │                              │
                    │  Mission Planning            │
                    │  Raster Processing           │
                    │  Route Comparison             │
                    │  Rover Energy Estimation      │
                    │  U-Net Model Inference        │
                    │  Gemini Integration           │
                    └──────────────┬───────────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │ Terrain Analysis │  │ Navigation Engine│  │ AI Intelligence  │
   │                  │  │                  │  │                  │
   │ DEM Processing   │  │ A* Search        │  │ Trained U-Net    │
   │ Slope Analysis   │  │ Dijkstra         │  │ Image Prediction │
   │ Roughness        │  │ Route Comparison │  │ Segmentation     │
   └──────────────────┘  └──────────────────┘  └──────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │       External AI API        │
                    │         Google Gemini        │
                    │     Mission Explanations     │
                    └──────────────────────────────┘
```

### Main Architectural Components

**1. Frontend — React and Vite**

Provides the interactive mission-control dashboard, navigation interfaces, map visualization, route configuration, AI image analysis, and mission reports.

**2. Backend — FastAPI**

Processes API requests and coordinates terrain analysis, mission planning, route generation, rover energy estimation, and AI inference.

**3. Terrain Processing Engine**

Uses DEM raster data to calculate terrain characteristics such as slope and roughness for navigation analysis.

**4. Navigation Engine**

Uses graph-search algorithms to calculate and compare rover routes while considering configured terrain constraints.

**5. U-Net AI Model**

Performs semantic segmentation of rover-camera images to identify terrain categories at pixel level.

**6. Gemini Integration**

Generates natural-language explanations from structured backend results.

---

## ⚡ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, Vite, Tailwind CSS |
| Mapping | Leaflet |
| Backend | Python, FastAPI, Uvicorn |
| Numerical Processing | NumPy |
| Geospatial Processing | Rasterio, GDAL |
| Pathfinding | A* Search, Dijkstra Algorithm |
| Deep Learning | PyTorch, U-Net |
| AI Integration | Google Gemini API, google-genai |
| Image Processing | Pillow, OpenCV (where configured) |

---

## 🧮 Algorithms and Analytical Models

### 1. Pathfinding Algorithms

**A* Search Algorithm**

Uses a heuristic-based graph-search approach to explore possible rover paths through the terrain grid.

**Dijkstra's Algorithm**

Uses cumulative path costs to explore terrain nodes and calculate routes without heuristic guidance.

### 2. Terrain Analysis

The terrain processing engine uses DEM raster data to derive navigation-related information.

- Elevation information.
- Terrain slope estimation.
- Local terrain roughness estimation.
- Slope-based traversability constraints.

### 3. Rover Energy Estimation

The energy estimation service considers configured rover and terrain parameters, including:

- Rover mass (kg).
- Baseline power consumption (W).
- Rolling resistance coefficient.
- Drivetrain efficiency.
- Terrain slope.
- Battery capacity and safety reserve.

These calculations provide estimated energy requirements for comparing mission alternatives. They are simplified engineering estimates, not validated flight-dynamics predictions.

### 4. U-Net Semantic Segmentation

The AI Terrain Intelligence module uses a U-Net convolutional neural network trained on AI4MARS image data.

The network performs pixel-level classification and generates a segmentation mask containing the predicted terrain categories.

The model is used for rover-camera image analysis and is separate from the DEM-based navigation engine.

---

## 📁 Project Structure

```text
MARSWALK/
│
├── backend/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes.py
│   │   │   ├── raster.py
│   │   │   ├── rover_routes.py
│   │   │   └── terrain_ai_routes.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── pydantic_models.py
│   │   │   ├── rover_models.py
│   │   │   └── terrain_ai_models.py
│   │   │
│   │   ├── services/
│   │   │   ├── gemini_analysis_service.py
│   │   │   ├── mission_service.py
│   │   │   ├── raster_service.py
│   │   │   ├── routing_service.py
│   │   │   ├── rover_energy_service.py
│   │   │   ├── rover_mission_service.py
│   │   │   ├── rover_route_comparison_service.py
│   │   │   ├── terrain_service.py
│   │   │   ├── terrain_ai_model.py
│   │   │   └── terrain_ai_service.py
│   │   │
│   │   └── main.py
│   │
│   ├── data/
│   │   └── processed/
│   │       ├── jezero_dem_mars_projected.tif
│   │       └── jezero_ortho_mars_projected.tif
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
└── README.md
```

*Note: This is a representative structure. Additional configuration files, model weights, and datasets may be present in the actual repository.*

---

## ⚙️ Installation and Local Setup

### Prerequisites

Install the following:

- Python 3.10 or newer.
- Node.js 18 or newer.
- npm.
- Git.

### 1. Clone the Repository

```bash
git clone https://github.com/A-Shihab/MarsWalk.git
cd MarsWalk
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the environment.

**Windows CMD:**

```cmd
venv\Scripts\activate
```

**Linux/macOS:**

```bash
source venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside the backend directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Replace the placeholder with your own Gemini API key.

Never commit your actual `.env` file or API credentials to GitHub.

### 4. Start the Backend Server

Run:

```bash
uvicorn app.main:app --reload --port 8001
```

The backend will run at:

```text
http://127.0.0.1:8001
```

FastAPI interactive API documentation:

```text
http://127.0.0.1:8001/docs
```

### 5. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173
```

**Important:** Ensure that the frontend API configuration points to the backend at port `8001` during local development.

---

## 🔌 Main Backend API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/rover/mission/plan` | POST | Generate a rover mission plan |
| `/api/rover/routes/compare` | POST | Compare rover navigation strategies |
| `/api/gemini/explain` | POST | Generate AI-assisted explanations |
| `/api/terrain-ai/predict` | POST | Perform U-Net terrain image prediction |

For complete request and response schemas, start the backend and visit:

`http://127.0.0.1:8001/docs`

---

## 🌍 Data Sources and Model Information

**Geospatial Data**

MARSWALK uses processed Jezero Crater terrain raster data, including:

- Digital Elevation Model (DEM).
- Orthomosaic raster imagery.

These datasets support terrain visualization, slope and roughness analysis, and rover route planning.

**AI Training Data**

The U-Net terrain segmentation model was trained using AI4MARS rover-camera imagery.

The model's predictions are intended for experimental terrain classification and should be interpreted within the limitations of its training data and validation performance.

---

## 🚀 Deployment

MARSWALK can be deployed using separate frontend and backend services.

A typical deployment configuration is:

- Frontend: Static hosting for the React/Vite application.
- Backend: Python-compatible application hosting or Docker-based hosting.
- Large datasets and trained model weights: Appropriate persistent or external storage.

When deploying, update the frontend API configuration to point to the publicly accessible backend URL.

Keep API keys and other secrets in the deployment platform's environment-variable settings.

---

## ⚖️ License and Copyright

Copyright © 2026 Asaduzzaman Shihab. All Rights Reserved.

Developed specifically for the NASA Space Apps Challenge.

No part of this software, including its architecture, code, and analytical models, may be reproduced, distributed, or modified without explicit written permission from the author.

**Disclaimer:** MARSWALK is an experimental educational and research prototype. It is not an official NASA product and is not validated for real Mars rover operations.

---

## 👨‍🚀 Project

**MARSWALK — Autonomous Mars Rover Mission Control & Navigation Intelligence**

Developed for the NASA Space Apps Challenge.
