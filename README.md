# Smart Cold Chain Monitoring & Dynamic Route Optimization System

A premium logistics intelligence dashboard simulating vaccine transportation across India. The system monitors vaccine temperatures, alerts on thermal failures, and dynamically optimizes routes to avoid excessive ambient risks in real time.

---

## Installation & Setup

### 1. Backend Setup
1.  Install python dependencies:
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
    The app will open on `http://localhost:5173`. 

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

---

## Backend Architecture & Simulation Engine

The backend of ColdChain AI is built as an event-driven telemetry and routing engine, coordinating path planning, thermal modeling, and statistical anomaly detection.

### 1. Routing & Thermal Risk Optimization

#### Dijkstra-based Thermal-aware Route Optimization
The system uses a modified Dijkstra algorithm to compute paths across the highway network. Standard routing only minimizes distance. ColdChain AI's routing solver treats ambient heat as a resistance (cost), forcing Dijkstra to route cargo around hot zones if the safety parameter thresholds are violated.

#### Alpha/Beta Weighted Routing Cost Function
Edge weights are computed using a linear combination of geographical distance and environmental risk:
$$\text{Cost}(u, v) = \alpha \times \text{Distance}(u, v) + \beta \times \text{Segment Risk}(u, v)$$
- **Alpha ($\alpha$):** Distance weight. Focuses routing on minimizing travel time/kilometers.
- **Beta ($\beta$):** Risk weight. Focuses routing on cargo safety. Higher values deflect the route away from hot zones.

#### Point Risk and Segment Risk Computation
- **Point Risk:** Ambient temperature ($T$) at any coordinate is converted to a risk multiplier:
  - $\le 15^\circ\text{C}$: Risk = $1.0$ (safe threshold)
  - $15^\circ\text{C}$ to $30^\circ\text{C}$: Risk = $1.0 + (T - 15.0) \times 0.1$
  - $> 30^\circ\text{C}$: Risk = $2.5 + (T - 30.0) \times 0.25$
- **Segment Risk:** To estimate risk along an edge $(u, v)$, the engine samples the coordinate risk at three points (start, midpoint, and target) and averages them:
  $$\text{Segment Risk} = \frac{\text{Risk}_{\text{start}} + \text{Risk}_{\text{midpoint}} + \text{Risk}_{\text{end}}}{3}$$

#### Geofencing and Temperature Zones
India is mapped into polygonal geographic zones (e.g., Himalayan Cool Zone, Rajasthan Heat Zone). The engine runs a **Ray-Casting Algorithm** (Point-in-Polygon) to check whether a truck coordinate lies inside a polygon boundary. If inside, it inherits that zone's live temperature; otherwise, it defaults to $25^\circ\text{C}$.

#### Dynamic Rerouting Behavior
If an operator changes a zone's temperature, or the truck refrigeration system fails, the engine triggers a reroute. It re-runs Dijkstra's algorithm using the truck's current coordinates as the start node and splayers the new path segments into the routing loop dynamically.

---

### 2. Thermodynamic Simulation & Telemetry

#### Newton’s Law of Cooling Thermodynamic Simulation
The vaccine internal temperature ($T_{\text{internal}}$) changes based on heat transfer between the insulated walls and active cooling:
$$\frac{dT}{dt} = k_{\text{heat}} \times (T_{\text{ambient}} - T_{\text{internal}}) - k_{\text{cool}} \times (T_{\text{internal}} - T_{\text{target}})$$
- $k_{\text{heat}}$ ($0.012$): Insulation heat leakage coefficient.
- $k_{\text{cool}}$ ($0.08$): Cooling efficiency coefficient.
- $T_{\text{target}}$ ($3.5^\circ\text{C}$): Target temperature of active cooling.

#### Refrigeration Failure Behavior
When active cooling is disabled, $k_{\text{cool}}$ is set to $0$. The cargo temperature rises purely due to environmental heat leakage, warming up toward the ambient external temperature ($T_{\text{ambient}}$).

#### High-speed Simulation Stability using Sub-steps
At high simulation speed multipliers (e.g., $10\text{x}$ to $100\text{x}$), a single large step would cause numerical integration to diverge. The engine solves this by dividing each step into multiple mini sub-steps:
$$\text{sub\_steps} = \max(1, \lfloor\text{speed\_multiplier}\rfloor), \quad dt = \frac{\text{speed\_multiplier}}{\text{sub\_steps}}$$
Newtonian heat integration is run sequentially `sub_steps` times with step size $dt$, preserving numerical convergence and smooth thermal curves.

---

### 3. Analytics & Synchronization

#### PELT Anomaly Detection
The engine evaluates the vaccine temperature history using the **Pruned Exact Linear Time (PELT)** change-point detection algorithm. By applying an L2 mean-shift cost model with a penalty of $2.0$, PELT identifies structural changes in the temperature curve (such as sudden compressor failure). If a change-point is detected in the last 6 points and the mean shifted upwards by $> 1.2^\circ\text{C}$, the engine raises a critical alert.

#### Real-time Telemetry Processing
During the simulation loop, the engine calculates the vehicle's position, integrates thermal physics, tests for anomalies, and compiles the metrics into a payload containing current speeds, ETA, coordinates, and comparison statistics.

#### WebSocket Live Updates
The server hosts a persistent WebSocket endpoint (`/ws`). In each simulation step, the engine pushes the compiled telemetry payload in JSON format to all active client connections concurrently.

#### ETA Calculation
Remaining transit time is computed by summing the Haversine distance from the truck's position to the next node and the distances of all remaining path segments, divided by the active speed:
$$\text{ETA} = \frac{\text{Remaining Distance}}{\text{Base Speed} \times \text{Speed Multiplier}}$$
