import pytest
from unittest.mock import patch, MagicMock
from app.services.data_sources.imerg import IMERGAdapter
from app.services.data_sources.osm import OSMAdapter
from app.services.data_sources.cache import clear_cache

def test_imerg_fallback():
    adapter = IMERGAdapter()
    adapter.enabled = False
    
    # Should fallback when disabled
    obs = adapter.get_data()
    assert obs.source_type == "SIMULATED"
    assert obs.variable == "precipitation"
    assert obs.value == 12.5

@patch("app.services.data_sources.imerg.requests.get")
def test_imerg_success(mock_get):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "items": [
            {"properties": {"precipitation": 45.2}}
        ]
    }
    mock_get.return_value = mock_resp
    
    adapter = IMERGAdapter()
    adapter.enabled = True
    adapter.username = "user"
    adapter.password = "pass"
    
    clear_cache()
    
    obs = adapter.get_data()
    assert obs.source_type == "PUBLIC"
    assert obs.value == 45.2

@patch("app.services.data_sources.osm.requests.post")
def test_osm_success(mock_post):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "elements": [
            {"tags": {"nodes": 3500}}
        ]
    }
    mock_post.return_value = mock_resp
    
    clear_cache()
    
    adapter = OSMAdapter()
    obs = adapter.get_data()
    
    assert obs.source_type == "PUBLIC"
    assert obs.value == 0.7

@patch("app.services.data_sources.osm.requests.post")
def test_osm_fallback(mock_post):
    mock_post.side_effect = Exception("Timeout")
    
    clear_cache()
    
    adapter = OSMAdapter()
    obs = adapter.get_data()
    
    assert obs.source_type == "SIMULATED"
    assert obs.value == 0.65
