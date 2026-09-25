from .imerg import IMERGAdapter
from .osm import OSMAdapter
from .base import NormalizedObservation

_imerg = IMERGAdapter()
_osm = OSMAdapter()

def get_current_rainfall() -> NormalizedObservation:
    return _imerg.get_data()

def get_current_exposure() -> NormalizedObservation:
    return _osm.get_data()

def get_data_sources_status() -> list:
    # IMERG
    try:
        r_obs = _imerg.get_data()
        imerg_status = {
            "name": "NASA GPM IMERG",
            "type": "precipitation",
            "status": "Available" if r_obs.source_type == "PUBLIC" else "Unavailable",
            "source_type": r_obs.source_type,
            "last_update": r_obs.observed_at.isoformat(),
            "quality": r_obs.quality
        }
    except Exception as e:
        imerg_status = {
            "name": "NASA GPM IMERG",
            "type": "precipitation",
            "status": "Unavailable",
            "source_type": "SIMULATED",
            "last_update": None,
            "quality": "Deterministic Demo Fallback"
        }

    # OSM
    try:
        e_obs = _osm.get_data()
        osm_status = {
            "name": "OpenStreetMap",
            "type": "infrastructure/exposure",
            "status": "Available" if e_obs.source_type == "PUBLIC" else "Unavailable",
            "source_type": e_obs.source_type,
            "last_update": e_obs.observed_at.isoformat(),
            "quality": e_obs.quality
        }
    except Exception as e:
        osm_status = {
            "name": "OpenStreetMap",
            "type": "infrastructure/exposure",
            "status": "Unavailable",
            "source_type": "SIMULATED",
            "last_update": None,
            "quality": "Deterministic Demo Fallback"
        }
        
    terrain_status = {
        "name": "Copernicus DEM",
        "type": "terrain/slope",
        "status": "Available",
        "source_type": "DERIVED",
        "last_update": "Static",
        "quality": "High"
    }

    return [imerg_status, osm_status, terrain_status]
