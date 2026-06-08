import networkx as nx
from backend.data.graph_data import CITIES, CONNECTIONS, haversine_distance
from backend.data.zones_data import get_zone_at_coordinate

def get_risk_from_temp(temp: float) -> float:
    """
    Translates a temperature value to a risk factor.
    Vaccines are safe in 2°C - 8°C.
    - If temp <= 15°C (Cool): risk is low (1.0)
    - If temp is 15°C - 30°C (Moderate): risk scales from 1.0 to 2.5
    - If temp > 30°C (Hot): risk scales from 2.5 to 5.5+
    """
    if temp <= 15.0:
        return 1.0
    elif temp <= 30.0:
        return 1.0 + (temp - 15.0) * 0.1
    else:
        return 2.5 + (temp - 30.0) * 0.25

def compute_edge_risk(
    coord_a: tuple,
    coord_b: tuple,
    zones_temperatures: dict,
    sample_interval_km: float = 20.0
) -> float:
    """
    Samples points along the route segment to estimate the overall temperature risk.
    The number of samples scales dynamically with the segment's haversine distance,
    sampling approximately once every `sample_interval_km` (default 20 km),
    with a minimum of 3 samples (start, midpoint, end).
    """
    lat_a, lon_a = coord_a
    lat_b, lon_b = coord_b
    
    # Dynamically determine number of samples based on segment distance
    segment_dist = haversine_distance(coord_a, coord_b)
    n_samples = max(3, int(segment_dist / sample_interval_km) + 1)
    
    # Generate evenly-spaced sample points via linear interpolation
    total_risk = 0.0
    for i in range(n_samples):
        t = i / (n_samples - 1)  # 0.0 to 1.0
        lat = lat_a + (lat_b - lat_a) * t
        lon = lon_a + (lon_b - lon_a) * t
        _, _, temp = get_zone_at_coordinate(lat, lon, zones_temperatures)
        total_risk += get_risk_from_temp(temp)
        
    return total_risk / n_samples

def build_nx_graph(zones_temperatures: dict, alpha: float, beta: float) -> nx.Graph:
    """
    Constructs the base NetworkX Graph and calculates edge costs.
    Cost = alpha * Distance + beta * Risk
    """
    G = nx.Graph()
    
    # Add nodes with coordinates
    for city, coords in CITIES.items():
        G.add_node(city, lat=coords[0], lon=coords[1])
        
    # Add edges with cost
    for u, v in CONNECTIONS:
        dist = haversine_distance(CITIES[u], CITIES[v])
        risk = compute_edge_risk(CITIES[u], CITIES[v], zones_temperatures)
        cost = alpha * dist + beta * risk
        G.add_edge(u, v, distance=dist, risk=risk, cost=cost)
        
    return G

def find_nearest_nodes(lat: float, lon: float, G: nx.Graph, n: int = 3) -> list:
    """
    Finds the n closest graph nodes to a given coordinate.
    """
    distances = []
    for node in G.nodes:
        node_lat = G.nodes[node]["lat"]
        node_lon = G.nodes[node]["lon"]
        dist = haversine_distance((lat, lon), (node_lat, node_lon))
        distances.append((node, dist))
    # Sort by distance
    distances.sort(key=lambda x: x[1])
    return distances[:n]

def calculate_route(
    start_coords: tuple,
    end_coords: tuple,
    zones_temperatures: dict,
    alpha: float = 1.0,
    beta: float = 250.0
) -> dict:
    """
    Computes the optimal path between start and end coordinates.
    Inserts virtual nodes for custom coordinates to perform exact Dijkstra routing.
    """
    G = build_nx_graph(zones_temperatures, alpha, beta)
    
    # Check if start/end match exact cities
    start_node = None
    end_node = None
    
    # Find matching cities if very close
    for city, coords in CITIES.items():
        if haversine_distance(start_coords, coords) < 0.1:
            start_node = city
        if haversine_distance(end_coords, coords) < 0.1:
            end_node = city
            
    # Create temp copy of graph for custom routing
    G_temp = G.copy()
    
    cleanup_nodes = []
    
    # If start is a custom coordinate, insert it
    if not start_node:
        start_node = "START_POS"
        G_temp.add_node(start_node, lat=start_coords[0], lon=start_coords[1])
        cleanup_nodes.append(start_node)
        # Connect to 3 nearest nodes
        near_nodes = find_nearest_nodes(start_coords[0], start_coords[1], G, 3)
        for target_node, dist in near_nodes:
            risk = compute_edge_risk(start_coords, CITIES[target_node], zones_temperatures)
            cost = alpha * dist + beta * risk
            G_temp.add_edge(start_node, target_node, distance=dist, risk=risk, cost=cost)
            
    # If end is a custom coordinate, insert it
    if not end_node:
        end_node = "END_POS"
        G_temp.add_node(end_node, lat=end_coords[0], lon=end_coords[1])
        cleanup_nodes.append(end_node)
        # Connect to 3 nearest nodes
        near_nodes = find_nearest_nodes(end_coords[0], end_coords[1], G, 3)
        for target_node, dist in near_nodes:
            risk = compute_edge_risk(end_coords, CITIES[target_node], zones_temperatures)
            cost = alpha * dist + beta * risk
            G_temp.add_edge(end_node, target_node, distance=dist, risk=risk, cost=cost)
            
    try:
        # Run Modified Dijkstra
        path_nodes = nx.shortest_path(G_temp, source=start_node, target=end_node, weight="cost")
        
        # Build path coordinates and metrics
        path_coords = []
        total_distance = 0.0
        total_risk = 0.0
        total_cost = 0.0
        
        for i in range(len(path_nodes)):
            curr_node = path_nodes[i]
            lat = G_temp.nodes[curr_node]["lat"]
            lon = G_temp.nodes[curr_node]["lon"]
            path_coords.append([lat, lon])
            
            if i > 0:
                prev_node = path_nodes[i-1]
                edge_data = G_temp[prev_node][curr_node]
                total_distance += edge_data["distance"]
                total_risk += edge_data["risk"]
                total_cost += edge_data["cost"]
                
        # Calculate average risk
        avg_risk = total_risk / (len(path_nodes) - 1) if len(path_nodes) > 1 else 1.0
        
        return {
            "success": True,
            "path_nodes": path_nodes,
            "path_coords": path_coords,
            "distance": round(total_distance, 2),
            "avg_risk": round(avg_risk, 2),
            "cost": round(total_cost, 2)
        }
        
    except nx.NetworkXNoPath:
        return {
            "success": False,
            "error": "No path found between the specified coordinates."
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
