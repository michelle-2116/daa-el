import math

# Coordinates of 30 major Indian cities (latitude, longitude)
CITIES = {
    "Delhi": (28.6139, 77.2090),
    "Mumbai": (19.0760, 72.8777),
    "Bengaluru": (12.9716, 77.5946),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639),
    "Hyderabad": (17.3850, 78.4867),
    "Pune": (18.5204, 73.8567),
    "Ahmedabad": (23.0225, 72.5714),
    "Jaipur": (26.9124, 75.7873),
    "Lucknow": (26.8467, 80.9462),
    "Nagpur": (21.1458, 79.0882),
    "Bhopal": (23.2599, 77.4126),
    "Patna": (25.5941, 85.1376),
    "Ranchi": (23.3441, 85.3096),
    "Bhubaneswar": (20.2961, 85.8245),
    "Visakhapatnam": (17.6868, 83.2185),
    "Vijayawada": (16.5062, 80.6480),
    "Kochi": (9.9312, 76.2673),
    "Coimbatore": (11.0168, 76.9558),
    "Madurai": (9.9252, 78.1198),
    "Srinagar": (34.0837, 74.7973),
    "Jammu": (32.7266, 74.8570),
    "Shimla": (31.1048, 77.1734),
    "Dehradun": (30.3165, 78.0322),
    "Guwahati": (26.1445, 91.7362),
    "Shillong": (25.5788, 91.8831),
    "Raipur": (21.2514, 81.6296),
    "Indore": (22.7196, 75.8577),
    "Surat": (21.1702, 72.8311),
    "Udaipur": (24.5854, 73.7125)
}

# Realistically connected city pairs representing major national highways/routes
CONNECTIONS = [
    # North Network
    ("Srinagar", "Jammu"),
    ("Jammu", "Shimla"),
    ("Jammu", "Delhi"),
    ("Shimla", "Dehradun"),
    ("Shimla", "Delhi"),
    ("Dehradun", "Delhi"),
    ("Dehradun", "Lucknow"),
    ("Delhi", "Jaipur"),
    ("Delhi", "Lucknow"),
    
    # West Network
    ("Jaipur", "Udaipur"),
    ("Jaipur", "Bhopal"),
    ("Udaipur", "Ahmedabad"),
    ("Udaipur", "Indore"),
    ("Ahmedabad", "Indore"),
    ("Ahmedabad", "Surat"),
    ("Indore", "Bhopal"),
    ("Indore", "Surat"),
    ("Indore", "Nagpur"),
    ("Surat", "Mumbai"),
    ("Mumbai", "Pune"),
    ("Mumbai", "Nagpur"),
    
    # Central/East Network
    ("Lucknow", "Patna"),
    ("Lucknow", "Bhopal"),
    ("Patna", "Ranchi"),
    ("Patna", "Kolkata"),
    ("Ranchi", "Kolkata"),
    ("Ranchi", "Bhubaneswar"),
    ("Ranchi", "Raipur"),
    ("Kolkata", "Bhubaneswar"),
    ("Kolkata", "Guwahati"),
    ("Guwahati", "Shillong"),
    ("Bhopal", "Nagpur"),
    ("Bhopal", "Raipur"),
    ("Raipur", "Nagpur"),
    ("Raipur", "Bhubaneswar"),
    ("Raipur", "Hyderabad"),
    ("Nagpur", "Pune"),
    ("Nagpur", "Hyderabad"),
    
    # South Network
    ("Pune", "Bengaluru"),
    ("Pune", "Hyderabad"),
    ("Hyderabad", "Vijayawada"),
    ("Hyderabad", "Bengaluru"),
    ("Bhubaneswar", "Visakhapatnam"),
    ("Visakhapatnam", "Vijayawada"),
    ("Vijayawada", "Chennai"),
    ("Vijayawada", "Bengaluru"),
    ("Bengaluru", "Chennai"),
    ("Bengaluru", "Coimbatore"),
    ("Bengaluru", "Kochi"),
    ("Chennai", "Coimbatore"),
    ("Chennai", "Madurai"),
    ("Coimbatore", "Kochi"),
    ("Coimbatore", "Madurai"),
    ("Kochi", "Madurai")
]

def haversine_distance(coord1, coord2):
    """
    Computes the geodesic distance between two points in kilometers.
    """
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 6371.0  # Earth's radius in km
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def get_graph_data():
    """
    Constructs and returns nodes and edges list for display and initialization.
    """
    nodes = [{"id": city, "name": city, "lat": lat, "lon": lon} for city, (lat, lon) in CITIES.items()]
    edges = []
    for u, v in CONNECTIONS:
        dist = haversine_distance(CITIES[u], CITIES[v])
        edges.append({
            "source": u,
            "target": v,
            "distance": round(dist, 2)
        })
    return {"nodes": nodes, "edges": edges}
