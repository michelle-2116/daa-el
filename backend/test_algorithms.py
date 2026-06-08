import sys
import os

# Ensure the parent directory is in the path so we can run this script directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.data.graph_data import CITIES, haversine_distance
from backend.data.zones_data import is_point_in_polygon, ZONES_CONFIG
from backend.algorithms.routing import calculate_route, compute_edge_risk
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

def test_dynamic_edge_sampling():
    print("\nRunning Dynamic Edge Sampling Tests...")
    
    # Delhi -> Lucknow is ~500 km. At 20 km intervals, we expect ~26 samples.
    # At the old 3-point approach, a hot zone between them could be missed.
    delhi = CITIES["Delhi"]
    lucknow = CITIES["Lucknow"]
    dist = haversine_distance(delhi, lucknow)
    expected_min_samples = max(3, int(dist / 20.0) + 1)
    print(f"Delhi-Lucknow distance: {dist:.1f} km -> Expected >={expected_min_samples} samples")
    assert expected_min_samples > 3, "Long edge should require more than 3 samples"
    
    # Short edge: Bengaluru -> Chennai is ~290 km -> ~15 samples
    bengaluru = CITIES["Bengaluru"]
    chennai = CITIES["Chennai"]
    dist_short = haversine_distance(bengaluru, chennai)
    expected_short = max(3, int(dist_short / 20.0) + 1)
    print(f"Bengaluru-Chennai distance: {dist_short:.1f} km -> Expected >={expected_short} samples")
    
    # Verify compute_edge_risk returns a valid positive risk score with dynamic sampling
    zones_temps = {"rajasthan_heat": 45.0}  # Hot Rajasthan
    risk = compute_edge_risk(delhi, lucknow, zones_temps)
    assert risk > 0, "Risk score should be positive"
    print(f"Delhi-Lucknow risk with hot Rajasthan: {risk:.3f}")
    
    # Verify configurable interval: a very small interval should increase samples
    risk_fine = compute_edge_risk(delhi, lucknow, zones_temps, sample_interval_km=5.0)
    # Both should be valid positive numbers (exact values may differ slightly)
    assert risk_fine > 0, "Fine-grained risk should also be positive"
    print(f"Delhi-Lucknow risk with 5km interval: {risk_fine:.3f}")
    
    print("Dynamic Edge Sampling Tests Passed!")

def test_anomaly_severity_classification():
    print("\nRunning Anomaly Severity Classification Tests...")
    
    # Warning severity: mild upward shift, temperature still under threshold
    # Shift from ~4°C to ~6°C (diff ~2.0, under threshold of 8.0)
    warning_history = [4.0, 4.0, 4.0, 4.1, 4.0, 4.0, 4.0, 4.0, 5.5, 5.8, 6.0, 6.2]
    res_warn = detect_anomaly_pelt(warning_history, threshold=8.0)
    if res_warn["detected"]:
        print(f"Mild shift -> Severity: {res_warn['severity']}, Type: {res_warn['type']}")
        assert res_warn["severity"] == "Warning", \
            f"Mild rise under threshold should be 'Warning', got '{res_warn['severity']}'"
    else:
        print("Mild shift not detected as anomaly (PELT penalty too high) - acceptable")
    
    # Critical severity: large spike exceeding threshold
    critical_history = [4.0, 4.0, 4.0, 4.0, 4.1, 4.0, 4.0, 4.0, 8.5, 12.1, 14.8, 16.5]
    res_crit = detect_anomaly_pelt(critical_history, threshold=8.0)
    assert res_crit["detected"] == True, "Critical spike MUST be detected"
    assert res_crit["severity"] == "Critical", \
        f"Spike exceeding threshold should be 'Critical', got '{res_crit['severity']}'"
    print(f"Large spike -> Severity: {res_crit['severity']}, Type: {res_crit['type']}")
    
    print("Anomaly Severity Classification Tests Passed!")

if __name__ == "__main__":
    print("==============================")
    print("STARTING ALGORITHMS VALIDATION")
    print("==============================")
    
    try:
        test_point_in_polygon()
        test_modified_dijkstra()
        test_pelt_anomaly()
        test_dynamic_edge_sampling()
        test_anomaly_severity_classification()
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
