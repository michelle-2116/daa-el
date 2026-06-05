from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio

from backend.data.graph_data import CITIES, get_graph_data
from backend.data.zones_data import ZONES_CONFIG
from backend.simulation.engine import sim_engine

app = FastAPI(title="Smart Cold Chain Monitoring System")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class RouteRequest(BaseModel):
    start_city: str
    end_city: str
    alpha: float = 1.0
    beta: float = 250.0

class ZoneTempRequest(BaseModel):
    zone_id: str
    temperature: float

class CoolingRequest(BaseModel):
    cooling_active: bool

class SpeedRequest(BaseModel):
    speed: float

class ThresholdRequest(BaseModel):
    threshold: float

class TempOverrideRequest(BaseModel):
    temp: float

# REST Endpoints
@app.get("/api/config")
def get_config():
    """
    Returns initial setup configuration: cities, zones and graph connectivity.
    """
    return {
        "cities": [{"name": name, "lat": lat, "lon": lon} for name, (lat, lon) in CITIES.items()],
        "zones": ZONES_CONFIG,
        "graph": get_graph_data()
    }

@app.get("/api/state")
def get_state():
    """
    Returns the current simulation telemetry state.
    """
    return sim_engine.get_state_payload()

@app.post("/api/route/generate")
def generate_route(req: RouteRequest):
    """
    Calculates initial route and resets simulation.
    """
    if req.start_city not in CITIES or req.end_city not in CITIES:
        raise HTTPException(status_code=400, detail="Invalid start or destination city.")
        
    sim_engine.start_city = req.start_city
    sim_engine.end_city = req.end_city
    sim_engine.start_coords = CITIES[req.start_city]
    sim_engine.end_coords = CITIES[req.end_city]
    sim_engine.alpha = req.alpha
    sim_engine.beta = req.beta
    
    success = sim_engine.initialize_simulation()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to initialize simulation route.")
        
    return sim_engine.get_state_payload()

@app.post("/api/simulation/start")
async def start_simulation():
    """
    Starts the simulation loop.
    """
    await sim_engine.start()
    return sim_engine.get_state_payload()

@app.post("/api/simulation/pause")
async def pause_simulation():
    """
    Pauses the simulation loop.
    """
    await sim_engine.pause()
    return sim_engine.get_state_payload()

@app.post("/api/simulation/resume")
async def resume_simulation():
    """
    Resumes the simulation loop.
    """
    await sim_engine.resume()
    return sim_engine.get_state_payload()

@app.post("/api/simulation/reset")
async def reset_simulation():
    """
    Resets the simulation state.
    """
    await sim_engine.reset()
    return sim_engine.get_state_payload()

@app.post("/api/simulation/cooling")
async def toggle_cooling(req: CoolingRequest):
    """
    Manually toggles active cooling on/off (failure mode).
    """
    sim_engine.cooling_active = req.cooling_active
    action = "activated" if req.cooling_active else "deactivated (FAILED)"
    sim_engine.log_event(f"Cooling system manually {action}")
    await sim_engine.broadcast_state()
    return sim_engine.get_state_payload()

@app.post("/api/simulation/speed")
async def set_speed(req: SpeedRequest):
    """
    Updates the simulation speed factor.
    """
    sim_engine.speed_multiplier = req.speed
    sim_engine.log_event(f"Simulation speed set to {req.speed}x")
    await sim_engine.broadcast_state()
    return sim_engine.get_state_payload()

@app.post("/api/simulation/threshold")
async def set_threshold(req: ThresholdRequest):
    """
    Updates the safety temperature threshold.
    """
    sim_engine.temp_threshold = req.threshold
    sim_engine.log_event(f"Safety threshold updated to {req.threshold}°C")
    await sim_engine.broadcast_state()
    return sim_engine.get_state_payload()

@app.post("/api/simulation/temp-override")
async def override_temp(req: TempOverrideRequest):
    """
    Overrides the internal truck temperature directly.
    """
    sim_engine.internal_temp = req.temp
    sim_engine.log_event(f"Internal truck temperature manually overridden to {req.temp}°C")
    # Record history point
    sim_engine.record_temp_history(is_anomaly=False, is_reroute=False)
    await sim_engine.broadcast_state()
    return sim_engine.get_state_payload()

@app.post("/api/zone/temperature")
async def update_zone_temperature(req: ZoneTempRequest):
    """
    Updates a temperature zone's current temperature.
    """
    success = sim_engine.update_zone_temp(req.zone_id, req.temperature)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid zone ID.")
    await sim_engine.broadcast_state()
    return sim_engine.get_state_payload()

# WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    sim_engine.connected_websockets.add(websocket)
    
    # Send current state immediately upon connecting
    await websocket.send_text(json_dumps_payload())
    
    try:
        while True:
            # We must listen for incoming messages to keep connection active
            # (or in case the client wants to issue commands over websocket)
            data = await websocket.receive_text()
            # Handle client signals if any
            
    except WebSocketDisconnect:
        sim_engine.connected_websockets.remove(websocket)
    except Exception:
        if websocket in sim_engine.connected_websockets:
            sim_engine.connected_websockets.remove(websocket)

def json_dumps_payload():
    import json
    return json.dumps(sim_engine.get_state_payload())
