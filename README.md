# 🚀 MARSWALK — Autonomous Mars Rover Mission Control & Navigation Intelligence

> **NASA Space Apps Challenge Project**
>
> An interactive Mars rover mission-control platform combining DEM-based terrain analysis, autonomous pathfinding, multi-strategy route comparison, rover energy estimation, and AI-powered terrain classification for Jezero Crater.

---

## 📋 Overview

**MARSWALK** is a web-based Mars terrain intelligence and rover mission-planning platform designed to simulate and evaluate rover navigation across the Jezero Crater region of Mars.

The platform integrates high-resolution Digital Elevation Model (DEM) data, terrain processing, graph-search pathfinding algorithms, rover energy estimation, and deep-learning-based terrain classification into an interactive dashboard.

MARSWALK helps users:

- Plan rover missions between selected geographic coordinates.
- Analyze terrain conditions using Jezero Crater DEM data.
- Calculate traversable rover routes under configurable slope constraints.
- Compare multiple navigation strategies.
- Estimate rover energy consumption and battery safety.
- Analyze rover-camera images using a trained U-Net segmentation model.
- Generate natural-language mission explanations using Google Gemini.

## ✨ Main Features

MARSWALK currently provides three main interactive modules.

### 1. Mission Planner

The Mission Planner generates rover mission plans using actual Jezero Crater terrain raster data.

**Key capabilities:**

- Select starting and destination coordinates.
- Convert geographic coordinates into corresponding DEM raster positions.
- Analyze elevation and terrain slope along the navigation area.
- Evaluate terrain traversability using configurable maximum-slope constraints.
- Generate a rover path using the navigation engine.
- Estimate mission distance and rover energy requirements.
- Evaluate estimated energy against battery capacity and safety reserve.
- Generate AI-assisted mission explanations using Gemini.

**Mission planning workflow:**

1. The user provides the rover's starting and destination coordinates.
2. The backend maps the coordinates to the projected terrain raster.
3. Terrain elevation and slope information are evaluated.
4. The navigation algorithm searches for a traversable path.
5. Rover energy requirements are estimated using configured physical parameters.
6. Mission results are returned to the frontend for visualization and analysis.

### 2. Rover Route Planner — Navigation Intelligence

The Rover Route Planner is a dedicated navigation module that calculates and compares alternative rover routes across the Jezero Crater DEM.

Unlike a simple straight-line navigation system, it evaluates possible paths through the terrain grid.

**Four navigation strategies:**

| Strategy | Objective |
|---|---|
| Shortest Route | Minimize total travel distance |
| Safest Route | Prefer routes with lower slope exposure |
| Energy-Efficient Route | Minimize estimated rover energy consumption |
| Balanced Route | Balance navigation cost and energy-related considerations |

**Key capabilities:**

- Configure starting and destination coordinates.
- Set a maximum allowed terrain slope.
- Generate individual rover routes.
- Compare different navigation strategies.
- Evaluate terrain slope along candidate routes.
- Avoid invalid diagonal corner-cutting movements.
- Compare route distance and estimated energy consumption.
- Visualize alternative routes on the terrain map.

**Navigation algorithms:**

- A* Search for heuristic-based route exploration.
- Dijkstra's Algorithm for cumulative-cost path exploration.
- Eight-direction grid connectivity for rover movement.
- Configurable terrain-based traversal constraints.

The route comparison engine helps users understand the trade-offs between distance, terrain safety, and estimated energy consumption.

### 3. AI Terrain Intelligence — U-Net Semantic Segmentation

MARSWALK includes a trained U-Net deep-learning model for pixel-level terrain classification of rover-camera images.

The model was trained using AI4MARS rover-camera image data and integrated into the FastAPI backend for image prediction.

**Terrain classification categories:**

| Class ID | Terrain Category |
|---|---|
| 0 | Soil |
| 1 | Bedrock |
| 2 | Sand |
| 3 | Big Rock |

**Key capabilities:**

- Upload a rover-camera image.
- Run image inference using the trained U-Net model.
- Generate a pixel-level segmentation mask.
- Identify different terrain categories.
- Visualize the predicted segmentation results.
- Explore terrain composition through AI-generated classification output.

**Model evaluation:**

The current model achieved the following results on the expert test dataset:

| Evaluation Metric | Result |
|---|---:|
| Pixel Accuracy | 92.95% |
| Mean Intersection over Union (mIoU) | 66.43% |

These metrics reflect the current model's evaluation results. Individual class performance varies, and the Big Rock class has significantly lower IoU than the other classes.

**Important:** The U-Net model was trained using AI4MARS rover-camera imagery. Its predictions are experimental and should not be treated as validated classification of Jezero orbital imagery or as a flight-certified rover navigation system.

---

## 🏛️ System Architecture

MARSWALK follows a frontend-backend architecture that separates user interaction, deterministic terrain and navigation calculations, deep-learning inference, and generative AI explanations.

```text
                   ┌───────────────────────────────┐
                   │        React Frontend         │
                   │                               │
                   │       Mission Planner         │
                   │      Rover Route Planner      │
                   │    AI Terrain Intelligence    │
                   │       Interactive Map         │
                   │       Mission Dashboard       │
                   └───────────────┬───────────────┘
                                   │
                                REST API
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │        FastAPI Backend        │
                   │                               │
                   │       Mission Service         │
                   │       Raster Service          │
                   │       Routing Service         │
                   │       Rover Energy Service    │
                   │       U-Net AI Service        │
                   │       Gemini Integration      │
                   └───────────────┬───────────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │ Terrain Engine   │  │ Navigation Engine│  │ AI Engine        │
   │                  │  │                  │  │                  │
   │ Jezero DEM       │  │ A* Search        │  │ Trained U-Net    │
   │ Elevation        │  │ Dijkstra         │  │ Image Inference  │
   │ Slope Analysis   │  │ Route Comparison │  │ Segmentation     │
   │ Roughness        │  │ Traversability   │  │ Terrain Classes  │
   └──────────────────┘  └──────────────────┘  └──────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │      Google Gemini API       │
                   │                               │
                   │     Mission Explanations     │
                   │     Navigation Briefings     │
                   └───────────────────────────────┘
```

### Architectural Principles

**1. Deterministic Navigation and Terrain Processing**

Terrain processing, route generation, and energy estimation are handled by Python backend services. These calculations do not depend on generative AI.

**2. Independent AI Terrain Classification**

The U-Net model performs image-based semantic segmentation independently of the DEM-based route-planning engine.

**3. AI-Assisted Explanations**

Gemini receives structured backend results and generates human-readable mission and navigation explanations. It does not replace the numerical pathfinding or energy calculations.

---

## 🧮 Algorithms and Engineering Models

### 1. DEM-Based Terrain Processing

MARSWALK uses processed Jezero Crater terrain raster data.

The terrain service derives:

- Elevation information.
- Terrain slope maps.
- Local terrain roughness maps.
- Terrain-based navigation constraints.

The slope and roughness calculations provide additional information about the terrain surface for navigation analysis.

### 2. Geographic Coordinate Mapping

The mission and route-planning systems use projected Jezero Crater raster data.

The navigation workflow maps user-provided geographic coordinates into corresponding raster/grid positions before performing route calculations.

This allows the pathfinding engine to operate on actual terrain-grid cells rather than arbitrary map coordinates.

### 3. A* Search Algorithm

A* is used for heuristic-based pathfinding.

It evaluates possible grid movements using accumulated path cost and a heuristic estimate of the remaining distance.

The algorithm supports terrain-aware navigation cost evaluation.

### 4. Dijkstra's Algorithm

Dijkstra's algorithm evaluates cumulative movement costs without relying on a heuristic estimate.

It provides an alternative graph-search approach for route calculation and comparison.

### 5. Rover Traversability

The navigation engine evaluates terrain cells against a configurable maximum allowed slope.

It uses eight-direction grid connectivity and prevents diagonal corner-cutting through blocked neighboring cells.

### 6. Rover Energy Estimation

The rover energy service estimates energy requirements using configurable rover and terrain parameters.

The model considers:

- Rover mass (kg).
- Baseline power consumption (W).
- Rolling resistance coefficient.
- Drivetrain efficiency.
- Terrain slope.
- Battery capacity.
- Battery safety reserve.

The energy estimates support mission evaluation and comparison between alternative routes.

These calculations are simplified engineering estimates and are not validated flight-dynamics or NASA rover power-system simulations.

---

## ⚡ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Styling | Tailwind CSS |
| Mapping | Leaflet |
| Backend | Python, FastAPI, Uvicorn |
| Numerical Processing | NumPy |
| Geospatial Processing | Rasterio, GDAL |
| Pathfinding | A*, Dijkstra |
| Deep Learning | PyTorch, U-Net |
| Image Processing | Pillow, OpenCV where configured |
| Generative AI | Google Gemini API |
| API Communication | REST API |

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

*Note: This is a representative structure. Actual files, model weights, configuration files, and datasets may differ.*

---

## ⚙️ Installation and Local Setup

### Prerequisites

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

Navigate to the backend:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate it.

**Windows CMD:**

```cmd
venv\Scripts\activate
```

**Linux/macOS:**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside the backend directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Replace the placeholder with your actual Gemini API key.

Never commit your real API key or `.env` file to GitHub.

### 4. Start the Backend

Run:

```bash
uvicorn app.main:app --reload --port 8001
```

Backend URL:

```text
http://127.0.0.1:8001
```

Interactive API documentation:

```text
http://127.0.0.1:8001/docs
```

### 5. Frontend Setup

Open a new terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Make sure the frontend API configuration points to the backend running on port `8001`.

---

## 🔌 Main Backend API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/rover/mission/plan` | POST | Generate DEM-based rover mission plans |
| `/api/rover/routes/compare` | POST | Compare rover navigation strategies |
| `/api/gemini/explain` | POST | Generate AI-assisted explanations |
| `/api/terrain-ai/predict` | POST | Perform U-Net terrain image prediction |

For complete request and response schemas, run the backend and visit:

`http://127.0.0.1:8001/docs`

---

## 🌍 Geospatial Data and AI Training

### Jezero Crater Terrain Data

MARSWALK uses processed Jezero Crater raster datasets:

- `jezero_dem_mars_projected.tif`
- `jezero_ortho_mars_projected.tif`

The DEM supports elevation, slope, roughness, and navigation analysis.

The orthomosaic provides corresponding terrain imagery for map visualization.

### U-Net Training Data

The U-Net model was trained using AI4MARS rover-camera image data.

The model generates pixel-level segmentation predictions for four terrain categories.

The model's performance should be interpreted according to its training data, test dataset, and class-specific evaluation metrics.

---

## 🚀 Deployment

MARSWALK is designed to support separate frontend and backend deployment.

A typical deployment configuration includes:

- **Frontend:** Static hosting for React and Vite.
- **Backend:** Python application hosting or Docker-based hosting.
- **Data and model weights:** Persistent or external storage appropriate for large raster datasets and trained models.

For deployment, update the frontend API configuration to point to the publicly accessible backend URL.

Configure Gemini API credentials using the deployment platform's environment variables.

---

## ⚖️ License and Copyright

Copyright © 2026 Asaduzzaman Shihab. All Rights Reserved.

Developed for the NASA Space Apps Challenge.

No part of this software, including its architecture, code, and analytical models, may be reproduced, distributed, or modified without explicit written permission from the author.

**Disclaimer:** MARSWALK is an experimental educational and research prototype. It is not an official NASA product and is not validated for real Mars rover operations.

---

## 👨‍🚀 Project

**MARSWALK — Autonomous Mars Rover Mission Control & Navigation Intelligence**

Developed for the NASA Space Apps Challenge.
