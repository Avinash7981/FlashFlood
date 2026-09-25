import pytest
from fastapi.testclient import TestClient
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_monitored_locations" in data
    assert "critical_locations" in data

def test_risk_map():
    response = client.get("/api/risk")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0
    assert "risk_score" in data["features"][0]["properties"]

def test_location_details():
    response = client.get("/api/locations/1")
    assert response.status_code == 200
    data = response.json()
    assert "current_risk" in data
    assert "catchment_information" in data

def test_location_not_found():
    response = client.get("/api/locations/999")
    assert response.status_code == 404

def test_scenario_run():
    payload = {"rainfall_modifier": 1.2, "saturation_modifier": 1.1}
    response = client.post("/api/scenarios/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "baseline_score" in data[0]
    assert "scenario_score" in data[0]

def test_alerts():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_evacuation_route():
    payload = {"origin_id": 1, "destination_id": 3}
    response = client.post("/api/evacuation/route", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "routes" in data
    assert data["data_mode"] == "SIMULATED"

if __name__ == "__main__":
    pytest.main(["-v", __file__])
