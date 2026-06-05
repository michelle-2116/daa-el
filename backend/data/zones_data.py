# Polygon coordinates for temperature zones across India (defined as [latitude, longitude])

ZONES_CONFIG = [
    {
        "id": "himalayan_cool",
        "name": "Himalayan Cool Zone",
        "default_temp": 10.0,
        "polygon": [
            [36.0, 73.0],
            [36.5, 77.0],
            [34.0, 80.0],
            [29.0, 81.0],
            [29.5, 77.0],
            [32.0, 74.0]
        ]
    },
    {
        "id": "rajasthan_heat",
        "name": "Rajasthan Heat Zone",
        "default_temp": 42.0,
        "polygon": [
            [29.0, 69.0],
            [30.0, 75.0],
            [26.0, 77.5],
            [23.0, 74.5],
            [23.5, 69.5]
        ]
    },
    {
        "id": "deccan_moderate",
        "name": "Deccan Moderate Zone",
        "default_temp": 28.0,
        "polygon": [
            [24.5, 74.0],
            [25.0, 82.0],
            [18.0, 82.5],
            [16.0, 79.0],
            [17.5, 73.5],
            [21.0, 73.0]
        ]
    },
    {
        "id": "malabar_humid",
        "name": "Malabar Humid Zone",
        "default_temp": 31.0,
        "polygon": [
            [21.0, 72.0],
            [21.0, 73.5],
            [15.0, 74.5],
            [10.0, 75.5],
            [8.0, 76.5],
            [8.0, 75.0],
            [13.0, 73.5],
            [18.0, 72.0]
        ]
    },
    {
        "id": "coromandel_heat",
        "name": "Coromandel Heat Zone",
        "default_temp": 38.0,
        "polygon": [
            [18.0, 84.0],
            [17.5, 81.5],
            [13.5, 79.8],
            [9.0, 78.5],
            [8.0, 77.5],
            [9.0, 79.5],
            [13.5, 80.5],
            [17.0, 83.5]
        ]
    },
    {
        "id": "rayalaseema_dry",
        "name": "Rayalaseema Dry Zone",
        "default_temp": 37.0,
        "polygon": [
            [16.0, 76.5],
            [16.0, 79.5],
            [13.0, 79.5],
            [13.0, 76.5]
        ]
    },
    {
        "id": "nilgiri_cool",
        "name": "Nilgiri Cool Zone",
        "default_temp": 14.0,
        "polygon": [
            [12.2, 75.8],
            [12.2, 77.5],
            [10.2, 77.5],
            [10.2, 75.8]
        ]
    },
    {
        "id": "eastern_humid",
        "name": "Eastern India Humid Zone",
        "default_temp": 27.0,
        "polygon": [
            [28.0, 87.0],
            [28.5, 93.0],
            [24.0, 94.0],
            [21.0, 90.0],
            [21.0, 86.0],
            [25.0, 85.0]
        ]
    }
]

def is_point_in_polygon(lat: float, lon: float, polygon: list) -> bool:
    """
    Ray-casting algorithm (point-in-polygon) to check if a lat/lon is inside a zone.
    """
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n]
        if lon > min(p1y, p2y):
            if lon <= max(p1y, p2y):
                if lat <= max(p1x, p2x):
                    if p1y != p2y:
                        xints = (lon - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or lat <= xints:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def get_zone_at_coordinate(lat: float, lon: float, zones_temperatures: dict) -> tuple:
    """
    Determines which zone a coordinate belongs to, and returns (zone_id, zone_name, current_temp).
    If it doesn't belong to any zone, returns ("outside", "Normal Zone", 25.0).
    """
    for zone in ZONES_CONFIG:
        if is_point_in_polygon(lat, lon, zone["polygon"]):
            zone_id = zone["id"]
            current_temp = zones_temperatures.get(zone_id, zone["default_temp"])
            return zone_id, zone["name"], current_temp
    return "outside", "Normal Zone", 25.0
