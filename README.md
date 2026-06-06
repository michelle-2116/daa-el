# Smart Cold Chain Monitoring & Dynamic Route Optimization System

A premium logistics intelligence dashboard simulating vaccine transportation across India. The system monitors vaccine temperatures, alerts on thermal failures, and dynamically optimizes routes to avoid excessive ambient risks in real time.

---

## Installation & Setup

### 1. Backend Setup
    ```
1.  Install python dependencies (if not already installed):
    ```bash
    pip install -r backend/requirements.txt
    ```
2.  Launch the FastAPI server:
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
