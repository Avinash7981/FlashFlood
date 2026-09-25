import pytest
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.risk_engine import calculate_baseline_risk, calculate_priority
from app.models import AlertSeverity

def test_risk_engine_low():
    res = calculate_baseline_risk(rainfall_mm_hr=5.0, soil_saturation_pct=10.0, slope_pct=5.0, historical_susceptibility=0.1)
    assert res["risk_band"] == AlertSeverity.LOW
    assert res["risk_score"] <= 20.0

def test_risk_engine_watch():
    res = calculate_baseline_risk(rainfall_mm_hr=25.0, soil_saturation_pct=40.0, slope_pct=15.0, historical_susceptibility=0.2)
    assert res["risk_band"] == AlertSeverity.WATCH

def test_risk_engine_high():
    res = calculate_baseline_risk(rainfall_mm_hr=60.0, soil_saturation_pct=60.0, slope_pct=25.0, historical_susceptibility=0.5)
    assert res["risk_band"] == AlertSeverity.HIGH

def test_risk_engine_critical():
    res = calculate_baseline_risk(rainfall_mm_hr=120.0, soil_saturation_pct=95.0, slope_pct=50.0, historical_susceptibility=0.9)
    assert res["risk_band"] == AlertSeverity.CRITICAL
    assert res["risk_score"] > 60.0

def test_risk_engine_normalization():
    # Should cap at 100
    res1 = calculate_baseline_risk(rainfall_mm_hr=200.0, soil_saturation_pct=150.0, slope_pct=100.0, historical_susceptibility=2.0)
    assert res1["risk_score"] == 100.0

def test_risk_engine_explainability():
    res = calculate_baseline_risk(rainfall_mm_hr=90.0, soil_saturation_pct=10.0, slope_pct=5.0, historical_susceptibility=0.1)
    # Rainfall should be the top driver
    assert res["top_drivers"][0]["factor"] == "Rainfall intensity"
    assert "high rainfall intensity" in res["explanation"]

if __name__ == "__main__":
    pytest.main(["-v", __file__])
