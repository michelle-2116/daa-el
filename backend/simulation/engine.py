import asyncio
import time
import json
from datetime import datetime
from backend.data.graph_data import CITIES, haversine_distance
from backend.data.zones_data import ZONES_CONFIG, get_zone_at_coordinate
from backend.algorithms.routing import calculate_route, compute_edge_risk, get_risk_from_temp
from backend.algorithms.anomaly import detect_anomaly_pelt

class SimulationEngine:
    def __init__(self):
        # Simulation settings
        self.status = "idle"  # idle, running, paused, finished
        self.speed_multiplier = 1.0  # 1x to 100x
        
        # Coordinates and route
        self.start_city = "Srinagar"
        self.end_city = "Kochi"
        self.start_coords = CITIES[self.start_city]
        self.end_coords = CITIES[self.end_city]
        
        self.route_coords = []
        self.route_nodes = []
        
        self.original_route_coords = []
        self.original_route_nodes = []
        self.route_type = "original"  # original, rerouted
        
        # Truck state
        self.current_lat = self.start_coords[0]
        self.current_lon = self.start_coords[1]
        self.current_edge_idx = 0  # Index in route_coords
        self.interpolation_progress = 0.0  # 0.0 to 1.0
        self.truck_speed_kmh = 80.0  # base truck speed in km/h
        
        # Temperature & Safety
        self.internal_temp = 4.0  # Initial vaccine temperature in °C
        self.external_temp = 25.0
        self.cooling_active = True
        self.temp_threshold = 8.0  # Safe threshold in °C
        
        # Live parameters
        self.alpha = 1.0
        self.beta = 250.0
        
        # Live Zone temperatures
        self.zones_temperatures = {zone["id"]: zone["default_temp"] for zone in ZONES_CONFIG}
        
        # History & Analytics
        self.temp_history = []  # List of dicts for charting: {"time": str, "temp": float, "is_anomaly": bool, "is_reroute": bool}
        self.raw_temps = []  # List of floats for PELT input
        self.event_logs = []
        self.reroute_points = []  # Coordinates where reroute was triggered
        self.active_anomaly = None  # None or dict detailing the anomaly
        self.start_time = None
        self.sim_elapsed_seconds = 0
        
        # WebSockets
        self.connected_websockets = set()
        
        # Background task
        self.loop_task = None

    def log_event(self, message: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        self.event_logs.append(log_entry)
        print(log_entry)

    def initialize_simulation(self):
        """
        Calculates the initial route and resets parameters.
        """
        self.status = "idle"
        self.sim_elapsed_seconds = 0
        self.route_type = "original"
        self.reroute_points = []
        self.active_anomaly = None
        self.cooling_active = True
        self.internal_temp = 4.0
        self.temp_history = []
        self.raw_temps = []
        self.event_logs = []
        
        # Compute route
        route_res = calculate_route(
            self.start_coords,
            self.end_coords,
            self.zones_temperatures,
            self.alpha,
            self.beta
        )
        
        if route_res["success"]:
            self.route_coords = route_res["path_coords"]
            self.route_nodes = route_res["path_nodes"]
            self.original_route_coords = list(self.route_coords)
            self.original_route_nodes = list(self.route_nodes)
            
            self.current_lat = self.start_coords[0]
            self.current_lon = self.start_coords[1]
            self.current_edge_idx = 0
            self.interpolation_progress = 0.0
            
            # Initial external temp
            _, _, ext_temp = get_zone_at_coordinate(self.current_lat, self.current_lon, self.zones_temperatures)
            self.external_temp = ext_temp
            
            # Record initial history point
            self.record_temp_history(is_anomaly=False, is_reroute=False)
            self.log_event(f"Simulation initialized from {self.start_city} to {self.end_city}")
            self.log_event(f"Route distance: {route_res['distance']} km, Estimated Cost: {route_res['cost']}")
            return True
        else:
            self.log_event(f"Route generation failed: {route_res.get('error')}")
            return False

    def record_temp_history(self, is_anomaly=False, is_reroute=False):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.temp_history.append({
            "time": timestamp,
            "temp": round(self.internal_temp, 2),
            "is_anomaly": is_anomaly,
            "is_reroute": is_reroute
        })
        self.raw_temps.append(self.internal_temp)
        # Keep histories capped to avoid memory bloating
        if len(self.temp_history) > 200:
            self.temp_history.pop(0)
            self.raw_temps.pop(0)

    def trigger_dynamic_reroute(self, reason: str):
        """
        Triggers Dijkstra from the truck's current position to the destination.
        """
        self.log_event(f"Dynamic rerouting activated! Reason: {reason}")
        self.reroute_points.append([self.current_lat, self.current_lon])
        
        current_coords = (self.current_lat, self.current_lon)
        # Calculate new route
        route_res = calculate_route(
            current_coords,
            self.end_coords,
            self.zones_temperatures,
            self.alpha,
            self.beta
        )
        
        if route_res["success"]:
            # Splice the new route coordinates in
            # The new route starts at current truck position.
            self.route_coords = route_res["path_coords"]
            self.route_nodes = route_res["path_nodes"]
            self.current_edge_idx = 0
            self.interpolation_progress = 0.0
            self.route_type = "rerouted"
            self.record_temp_history(is_anomaly=False, is_reroute=True)
            self.log_event(f"New safer route generated (Cost: {route_res['cost']}). Path: {' -> '.join(self.route_nodes)}")
            return True
        else:
            self.log_event(f"Rerouting failed: {route_res.get('error')}. Continuing on current path.")
            return False

    def update_zone_temp(self, zone_id: str, new_temp: float):
        """
        Updates a zone temperature and triggers a reroute check if simulation is active.
        """
        if zone_id in self.zones_temperatures:
            old_temp = self.zones_temperatures[zone_id]
            self.zones_temperatures[zone_id] = new_temp
            self.log_event(f"Zone '{zone_id}' temperature updated from {old_temp}°C to {new_temp}°C")
            
            # If running or paused, check if we should reroute
            if self.status in ["running", "paused"]:
                # Trigger reroute due to environmental temperature changes
                self.trigger_dynamic_reroute(f"Zone '{zone_id}' temperature changed to {new_temp}°C")
                return True
        return False

    def get_state_payload(self) -> dict:
        """
        Compiles the current telemetry state for WebSockets or REST responses.
        """
        # Calculate ETA
        eta_seconds = 0
        if len(self.route_coords) > 1 and self.status == "running":
            remaining_dist = 0.0
            # Distance from current position to next node
            if self.current_edge_idx < len(self.route_coords) - 1:
                next_node_coords = self.route_coords[self.current_edge_idx + 1]
                remaining_dist += haversine_distance((self.current_lat, self.current_lon), next_node_coords)
                
                # Plus distance of all remaining segments
                for i in range(self.current_edge_idx + 1, len(self.route_coords) - 1):
                    remaining_dist += haversine_distance(self.route_coords[i], self.route_coords[i+1])
                    
            # ETA in simulated seconds
            eta_seconds = (remaining_dist / (self.truck_speed_kmh * self.speed_multiplier)) * 3600.0
            
        # Get current zone details
        zone_id, zone_name, ext_temp = get_zone_at_coordinate(self.current_lat, self.current_lon, self.zones_temperatures)
        self.external_temp = ext_temp
        
        # Calculate route cost & risk
        route_dist = 0.0
        route_risk = 0.0
        for i in range(len(self.route_coords) - 1):
            d = haversine_distance(self.route_coords[i], self.route_coords[i+1])
            r = compute_edge_risk(self.route_coords[i], self.route_coords[i+1], self.zones_temperatures)
            route_dist += d
            route_risk += r
            
        avg_risk = route_risk / (len(self.route_coords) - 1) if len(self.route_coords) > 1 else 1.0
        cost = self.alpha * route_dist + self.beta * route_risk
        
        # Original route metrics for comparison
        orig_dist = 0.0
        orig_risk = 0.0
        for i in range(len(self.original_route_coords) - 1):
            d = haversine_distance(self.original_route_coords[i], self.original_route_coords[i+1])
            r = compute_edge_risk(self.original_route_coords[i], self.original_route_coords[i+1], self.zones_temperatures)
            orig_dist += d
            orig_risk += r
        orig_avg_risk = orig_risk / (len(self.original_route_coords) - 1) if len(self.original_route_coords) > 1 else 1.0
        orig_cost = self.alpha * orig_dist + self.beta * orig_risk
        
        return {
            "status": self.status,
            "speed_multiplier": self.speed_multiplier,
            "truck_position": {"lat": round(self.current_lat, 5), "lon": round(self.current_lon, 5)},
            "current_edge_idx": self.current_edge_idx,
            "route_coords": self.route_coords,
            "route_nodes": self.route_nodes,
            "original_route_coords": self.original_route_coords,
            "original_route_nodes": self.original_route_nodes,
            "route_type": self.route_type,
            "internal_temp": round(self.internal_temp, 2),
            "external_temp": round(self.external_temp, 2),
            "cooling_active": self.cooling_active,
            "temp_threshold": self.temp_threshold,
            "current_zone_name": zone_name,
            "current_zone_id": zone_id,
            "current_risk_score": round(get_risk_from_temp(self.external_temp), 2),
            "truck_speed_kmh": self.truck_speed_kmh,
            "distance_km": round(route_dist, 2),
            "avg_risk": round(avg_risk, 2),
            "cost": round(cost, 2),
            "eta_seconds": round(eta_seconds, 1),
            "reroute_points": self.reroute_points,
            "active_anomaly": self.active_anomaly,
            "temp_history": self.temp_history,
            "event_logs": self.event_logs,
            "zones_temperatures": self.zones_temperatures,
            "route_comparison": {
                "original": {
                    "distance": round(orig_dist, 2),
                    "avg_risk": round(orig_avg_risk, 2),
                    "cost": round(orig_cost, 2)
                },
                "current": {
                    "distance": round(route_dist, 2),
                    "avg_risk": round(avg_risk, 2),
                    "cost": round(cost, 2)
                }
            }
        }

    async def broadcast_state(self):
        """
        Sends the telemetry state to all connected WebSockets.
        """
        if not self.connected_websockets:
            return
            
        payload = self.get_state_payload()
        message = json.dumps(payload)
        
        # Broadcast
        disconnected = set()
        for ws in self.connected_websockets:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.add(ws)
                
        self.connected_websockets.difference_update(disconnected)

    async def simulation_step(self):
        """
        Executes a single second of simulation.
        Updates positions, thermal transfers, runs PELT, checks reroutes.
        """
        if self.status != "running":
            return
            
        self.sim_elapsed_seconds += 1
        
        # We run the physical movement and thermal integration in sub-steps of at most 1 second each.
        # This keeps the math stable and correct at high speed multipliers (e.g. 1x to 100x).
        sub_steps = max(1, int(self.speed_multiplier))
        dt = self.speed_multiplier / sub_steps
        
        # Base speed of truck in km per second
        base_speed_kms = self.truck_speed_kmh / 3600.0
        distance_to_travel = base_speed_kms * self.speed_multiplier
        
        # 1. Update position along current route (consuming distance_to_travel)
        while distance_to_travel > 0 and self.current_edge_idx < len(self.route_coords) - 1:
            p1 = self.route_coords[self.current_edge_idx]
            p2 = self.route_coords[self.current_edge_idx + 1]
            segment_distance = haversine_distance(p1, p2)
            
            if segment_distance <= 0:
                self.current_edge_idx += 1
                self.interpolation_progress = 0.0
                continue
                
            remaining_segment_distance = segment_distance * (1.0 - self.interpolation_progress)
            
            if distance_to_travel >= remaining_segment_distance:
                distance_to_travel -= remaining_segment_distance
                self.current_edge_idx += 1
                self.interpolation_progress = 0.0
                
                # Check if we arrived at destination
                if self.current_edge_idx >= len(self.route_coords) - 1:
                    self.status = "finished"
                    self.current_lat = self.end_coords[0]
                    self.current_lon = self.end_coords[1]
                    self.log_event("Vaccine cargo successfully delivered to destination!")
                    self.record_temp_history(is_anomaly=False, is_reroute=False)
                    await self.broadcast_state()
                    return
                else:
                    # Arrived at intermediate node city
                    city_reached = self.route_nodes[self.current_edge_idx]
                    self.log_event(f"Truck arrived at {city_reached}")
                    self.current_lat = self.route_coords[self.current_edge_idx][0]
                    self.current_lon = self.route_coords[self.current_edge_idx][1]
            else:
                self.interpolation_progress += distance_to_travel / segment_distance
                distance_to_travel = 0.0
                self.current_lat = p1[0] + (p2[0] - p1[0]) * self.interpolation_progress
                self.current_lon = p1[1] + (p2[1] - p1[1]) * self.interpolation_progress
                
        # 2. Update Temperatures (Vaccine Thermal Physics)
        # We integrate the thermal model in sub-steps of size dt to prevent numerical instability.
        k_heat = 0.012  # heat leakage from outside
        k_cool = 0.08   # refrigeration cooling rate
        T_target = 3.5  # target temperature of active cooling
        
        for _ in range(sub_steps):
            # Determine outside temp based on current truck position
            _, zone_name, ext_temp = get_zone_at_coordinate(self.current_lat, self.current_lon, self.zones_temperatures)
            self.external_temp = ext_temp
            
            temp_delta = k_heat * (self.external_temp - self.internal_temp)
            if self.cooling_active:
                temp_delta -= k_cool * (self.internal_temp - T_target)
                
            self.internal_temp += temp_delta * dt
            
        # 3. Anomaly detection via PELT
        is_anomaly_step = False
        
        anomaly_res = detect_anomaly_pelt(self.raw_temps + [self.internal_temp], self.temp_threshold)
        if anomaly_res["detected"] and not self.active_anomaly:
            # New anomaly detected!
            self.active_anomaly = {
                "type": anomaly_res["type"],
                "severity": anomaly_res["severity"],
                "message": anomaly_res["message"],
                "index": len(self.raw_temps)
            }
            is_anomaly_step = True
            self.log_event(anomaly_res["message"])
            
            # If anomaly is critical or warning, trigger dynamic rerouting!
            self.trigger_dynamic_reroute(f"Vaccine thermal anomaly: {anomaly_res['type']} ({anomaly_res['severity']})")
        elif not anomaly_res["detected"] and self.active_anomaly:
            # Anomaly cleared
            self.log_event("Vaccine temperature stabilized. Anomaly cleared.")
            self.active_anomaly = None
            
        self.record_temp_history(is_anomaly=is_anomaly_step, is_reroute=False)
        
        # 4. Check if route risk has changed significantly while traveling
        if self.current_edge_idx < len(self.route_coords) - 1:
            p1 = self.route_coords[self.current_edge_idx]
            p2 = self.route_coords[self.current_edge_idx + 1]
            current_seg_risk = compute_edge_risk(p1, p2, self.zones_temperatures)
            if current_seg_risk > 3.8 and self.route_type == "original":
                self.trigger_dynamic_reroute(f"Upcoming route risk too high ({current_seg_risk:.2f})")
                
        # 5. Broadcast new state
        await self.broadcast_state()

    async def start(self):
        if self.status in ["idle", "finished"]:
            self.initialize_simulation()
            
        self.status = "running"
        self.log_event("Simulation started")
        await self.broadcast_state()
        
        if not self.loop_task or self.loop_task.done():
            self.loop_task = asyncio.create_task(self.run_loop())

    async def pause(self):
        if self.status == "running":
            self.status = "paused"
            self.log_event("Simulation paused")
            await self.broadcast_state()

    async def resume(self):
        if self.status == "paused":
            self.status = "running"
            self.log_event("Simulation resumed")
            await self.broadcast_state()
            if not self.loop_task or self.loop_task.done():
                self.loop_task = asyncio.create_task(self.run_loop())

    async def reset(self):
        self.status = "idle"
        # Restore default zone temps
        self.zones_temperatures = {zone["id"]: zone["default_temp"] for zone in ZONES_CONFIG}
        self.initialize_simulation()
        await self.broadcast_state()

    async def run_loop(self):
        try:
            while self.status == "running":
                await self.simulation_step()
                # Run step every 1 second
                await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            self.log_event(f"Error in simulation loop: {e}")
            self.status = "paused"
            await self.broadcast_state()

# Global singleton instance
sim_engine = SimulationEngine()
