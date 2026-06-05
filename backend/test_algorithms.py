import sys
import os

# Ensure the parent directory is in the path so we can run this script directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.data.graph_data import CITIES
from backend.data.zones_data import is_point_in_polygon, ZONES_CONFIG
from backend.algorithms.routing import calculate_route
from backend.algorithms.anomaly import detect_anomaly_pelt

def test_point_in_polygon():
    print("Running Point-in-Polygon Tests...")
    
    # Rajasthan zone config
    rajasthan = next(z for z in ZONES_CONFIG if z["id"] == "rajasthan_heat")
    poly = rajasthan["polygon"]
    
    # Jaipur coordinate is around (26.9, 75.78)
    jaipur = (26.9124, 75.7873)
    assert is_point_in_polygon(jaipur[0], jaipur[1], poly) == True, "Jaipur should be in Rajasthan Zone!"
    
    # Bengaluru coordinate is (12.97, 77.59) - should be outside Rajasthan
    bengaluru = (12.9716, 77.5946)
    assert is_point_in_polygon(bengaluru[0], bengaluru[1], poly) == False, "Bengaluru should NOT be in Rajasthan Zone!"
    
    print("Point-in-Polygon Tests Passed!")

def test_modified_dijkstra():
    print("\nRunning Modified Dijkstra Tests...")
    
    # Test route from Srinagar to Kochi
    # Srinagar: 34.08, 74.79
    # Kochi: 9.93, 76.26
    start_coords = CITIES["Srinagar"]
    end_coords = CITIES["Kochi"]
    
    # Base case: low beta (prefer shortest route)
    route_shortest = calculate_route(
        CITIES["Srinagar"],
        CITIES["Kochi"],
        zones_temperatures={},
        alpha=1.0,
        beta=0.0
    )
    assert route_shortest["success"] == True
    print(f"Shortest path nodes: {' -> '.join(route_shortest['path_nodes'])}")
    print(f"Shortest path distance: {route_shortest['distance']} km")
    
    # Safety case: high beta (avoid heat zones if possible)
    # We will simulate high temperatures in Deccan (which lies between North and South)
    zones_temps = {
        "deccan_moderate": 45.0,  # extreme heat
        "rajasthan_heat": 45.0,
        "coromandel_heat": 20.0,  # moderate/cool coast
    }
    
    route_safer = calculate_route(
        CITIES["Srinagar"],
        CITIES["Kochi"],
        zones_temperatures=zones_temps,
        alpha=1.0,
        beta=400.0
    )
    assert route_safer["success"] == True
    print(f"Safer path nodes: {' -> '.join(route_safer['path_nodes'])}")
    print(f"Safer path distance: {route_safer['distance']} km")
    print(f"Safer path risk score: {route_safer['avg_risk']}")
    
    print("Modified Dijkstra Tests Passed!")

def test_pelt_anomaly():
    print("\nRunning PELT Anomaly Tests...")
    
    # Test stable sequence (no anomaly)
    stable_history = [4.0, 4.0, 4.1, 4.0, 3.9, 4.0, 4.1, 4.0, 4.0, 4.1, 4.0, 3.9]
    res_stable = detect_anomaly_pelt(stable_history, threshold=8.0)
    assert res_stable["detected"] == False, "Stable history should NOT flag an anomaly"
    
    # Test temperature spike sequence (should trigger anomaly)
    spike_history = [4.0, 4.0, 4.0, 4.0, 4.1, 4.0, 4.0, 4.0, 8.5, 12.1, 14.8, 16.5]
    res_spike = detect_anomaly_pelt(spike_history, threshold=8.0)
    assert res_spike["detected"] == True, "Spike history SHOULD flag an anomaly"
    print(f"Detected anomaly: {res_spike['type']} ({res_spike['severity']})")
    print(f"Anomaly message: {res_spike['message']}")
    
    print("PELT Anomaly Tests Passed!")

if __name__ == "__main__":
    print("==============================")
    print("STARTING ALGORITHMS VALIDATION")
    print("==============================")
    
    try:
        test_point_in_polygon()
        test_modified_dijkstra()
        test_pelt_anomaly()
        print("\n==============================")
        print("ALL ALGORITHM TESTS PASSED SUCCESSFUL!")
        print("==============================")
        sys.exit(0)
    except AssertionError as e:
        print(f"\nAssertion error occurred: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error occurred: {e}")
        sys.exit(1)
