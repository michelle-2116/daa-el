# Smart Cold Chain Monitoring & Dynamic Route Optimization System

A premium logistics intelligence dashboard simulating vaccine transportation across India. The system monitors vaccine temperatures, alerts on thermal failures, and dynamically optimizes routes to avoid excessive ambient risks in real time.

---

## Technical Architecture

```mermaid
graph TD
    subgraph Frontend (React + Vite)
        UI[Glassmorphic Control Panel] -->|REST APIs| API_Gateway
        UI -->|WebSocket Connection| WS_Handler
        LeafletMap[Leaflet India Map] <--> UI
        Recharts[Recharts Temperature Graph] <--> UI
    end

    subgraph Backend (FastAPI)
        API_Gateway --> Controllers[REST Controllers]
        WS_Handler <--> SSE[WebSocket State Manager]
        Controllers --> SimEngine[Simulation Engine]
        SimEngine --> Routing[Modified Dijkstra Routing]
        SimEngine --> Anomaly[PELT Anomaly Detector]
        Routing --> GraphData[30-Node India Road Graph]
    end
```

### 1. Routing Engine (Modified Dijkstra)
The path optimization accounts for both geographical distance and heat-zone risks:
$$\text{Cost} = \alpha \cdot \text{Distance} + \beta \cdot \text{Risk}$$
*   **Distance**: Calculated dynamically via the **Haversine formula**.
*   **Risk**: Evaluated by checking polygon intersection (Ray-Casting Point-in-Polygon) at multiple sampled points along road segments. Hotter zone temperatures translate into higher risk coefficients.
*   **Dynamic Rerouting**: When a zone temperature increases or the vaccine starts heating up, a temporary node representing the truck's exact latitude/longitude is injected into the graph. Dijkstra recalculates the remaining path from that coordinate rather than backtracking to the origin.

### 2. Vaccine Thermal Model
Internal container temperature is simulated based on Newton's law of cooling:
$$T_{\text{inside}}(t) = T_{\text{inside}}(t-1) + k_{\text{leak}} \cdot (T_{\text{outside}} - T_{\text{inside}}) - \left[ k_{\text{cool}} \cdot (T_{\text{inside}} - T_{\text{target}}) \right]_{\text{active}}$$
*   **Normal Mode**: Active cooling counteracts ambient heat leakage, keeping vaccines close to $3.5^\circ\text{C}$.
*   **Cooling Failure**: Active cooling is cut, causing internal temperature to leak rapidly towards the outside zone's temperature.

### 3. Anomaly Detection (PELT Algorithm)
Using the `ruptures` library, **Pruned Exact Linear Time (PELT)** change-point detection is run on recent temperature history:
*   Identifies mean shifts in the temperature signal.
*   Classifies changes into **Sudden Spikes** or **Sustained Rises** based on post-change slope and absolute threshold boundaries (limit set to $8^\circ\text{C}$).

---

## Installation & Setup

### Prerequisites
*   Anaconda / Miniconda (with `daa` environment installed)
*   Node.js (v16+)

### 1. Backend Setup
1.  Open your terminal and activate the conda environment:
    ```bash
    conda activate daa
    ```
2.  Install python dependencies (if not already installed):
    ```bash
    pip install -r backend/requirements.txt
    ```
3.  Launch the FastAPI server:
    ```bash
    uvicorn backend.main:app --reload
    ```
    The server will start on `http://localhost:8000`.

### 2. Frontend Setup
1.  Navigate to the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install NPM packages:
    ```bash
    npm install
    ```
3.  Run the Vite development server:
    ```bash
    npm run dev
    ```
    The app will open on `http://localhost:5173`. Vite is pre-configured to proxy `/api` and `/ws` requests directly to port 8000.

---

## Code Structure

```
myproj24_daa/
├── backend/
│   ├── algorithms/
│   │   ├── __init__.py
│   │   ├── anomaly.py       # PELT Change Point Detector
│   │   └── routing.py       # Modified Dijkstra & Haversine
│   ├── data/
│   │   ├── __init__.py
│   │   ├── graph_data.py    # 30 major Indian cities & highways
│   │   └── zones_data.py    # Bounding polygons & point-in-polygon
│   ├── simulation/
│   │   ├── __init__.py
│   │   └── engine.py        # Background thread & update loops
│   ├── main.py              # FastAPI Controllers & WebSockets
│   ├── requirements.txt     # Backend packages list
│   └── test_algorithms.py   # Automated algorithm unit tests
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Analytics.jsx   # Metrics, Risk dials & Route comparison
│   │   │   ├── Controls.jsx    # City selectors, sliders & Zone temp changes
│   │   │   ├── EventLogs.jsx   # Scrolling monospace log viewer
│   │   │   ├── MapView.jsx     # Leaflet map drawing zones & routes
│   │   │   └── TempChart.jsx   # Recharts live vaccine temperature area plot
│   │   ├── App.jsx             # Core React app state & WebSocket handler
│   │   ├── index.css           # Global CSS, Tailwind & glassmorphism custom classes
│   │   └── main.jsx            # React entry mount
│   ├── index.html              # HTML shell loading Leaflet & Google Fonts
│   ├── package.json            # Vite node packages
│   ├── postcss.config.js       # PostCSS compiler config
│   ├── tailwind.config.js      # Tailwind configurations & theme colors
│   └── vite.config.js          # Proxy setups for API integration
└── README.md
```
