import numpy as np

# We import ruptures inside a try-except block to make the code resilient
# in case of setup dependencies issues.
try:
    import ruptures as rpt
    RUPTURES_AVAILABLE = True
except ImportError:
    RUPTURES_AVAILABLE = False

def detect_anomaly_pelt(temp_history: list, threshold: float = 8.0) -> dict:
    """
    Analyzes the temperature history using the PELT (Pruned Exact Linear Time) algorithm
    to detect change points (spikes or sustained shifts).
    
    Returns a dict with anomaly state, type, severity, index, and a descriptive message.
    """
    n_points = len(temp_history)
    
    # We need a minimum history (e.g., 8 points) to perform any meaningful change-point analysis
    if n_points < 8:
        return {"detected": False}
        
    points = np.array(temp_history)
    
    # 1. First check if we are currently exceeding the absolute threshold
    # (this is an immediate safety violation)
    current_temp = points[-1]
    if current_temp > threshold:
        # We can still check PELT to see if it was a sudden break or just a gradual rise
        pass

    if RUPTURES_AVAILABLE:
        try:
            # We run PELT with the L2 (mean-shift) cost model.
            # min_size=3 means a segment must be at least 3 seconds long.
            # pen (penalty) balances underfitting vs overfitting.
            # A penalty of 1.5 - 2.5 is typical for detecting quick shifts.
            algo = rpt.Pelt(model="l2", min_size=3).fit(points)
            # Predict the segment boundary indices
            change_points = algo.predict(pen=2.0)
            
            # The result is a list of indices ending with len(points)
            # E.g. [12, 25, 30] (where 30 is the end of array of size 30)
            if len(change_points) > 1:
                # The last element is the end of the array. The second to last is the latest change point.
                last_cp = change_points[-2]
                
                # Check if the change point is relatively recent (occurred in the last 6 points)
                # so we alert user immediately when it happens.
                if n_points - last_cp <= 6:
                    # Compute statistical properties before and after the change point
                    # We look at up to 10 points before
                    pre_slice = points[max(0, last_cp - 10):last_cp]
                    post_slice = points[last_cp:]
                    
                    mean_before = np.mean(pre_slice) if len(pre_slice) > 0 else points[0]
                    mean_after = np.mean(post_slice)
                    
                    diff = mean_after - mean_before
                    
                    # If temperature shifted upwards
                    if diff > 1.2:
                        severity = "Critical" if current_temp > threshold or diff > 3.0 else "Warning"
                        anomaly_type = "Sudden Spike" if diff > 2.5 else "Sustained Rise"
                        
                        return {
                            "detected": True,
                            "type": anomaly_type,
                            "severity": severity,
                            "index": int(last_cp),
                            "message": f"Anomaly ({anomaly_type}) detected: Mean shifted from {mean_before:.2f}°C to {mean_after:.2f}°C (+{diff:.2f}°C)"
                        }
        except Exception as e:
            # Fallback to rule-based detection if PELT raises an error
            pass
            
    # 2. Rule-based Fallback Detector
    # This runs if ruptures is not available or failed.
    # It checks for a sudden spike in the last 3 points or threshold violation.
    if n_points >= 3:
        # Check spike (diff between current and 3 steps ago)
        diff_recent = points[-1] - points[-3]
        if diff_recent > 1.5:
            severity = "Critical" if current_temp > threshold or diff_recent > 3.0 else "Warning"
            anomaly_type = "Sudden Spike"
            return {
                "detected": True,
                "type": anomaly_type,
                "severity": severity,
                "index": n_points - 1,
                "message": f"Anomaly ({anomaly_type}) detected via fallback: Temp rose by {diff_recent:.2f}°C in 3s"
            }
            
    # Check simple threshold violation
    if current_temp > threshold:
        return {
            "detected": True,
            "type": "Threshold Exceeded",
            "severity": "Critical",
            "index": n_points - 1,
            "message": f"Vaccine temperature {current_temp:.2f}°C exceeds safe threshold of {threshold:.2f}°C!"
        }
        
    return {"detected": False}
