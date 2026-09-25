import os
import requests
from datetime import datetime
from .base import DataSourceAdapter, NormalizedObservation
from .cache import get_cached, set_cached

class IMERGAdapter(DataSourceAdapter):
    def __init__(self):
        self.enabled = os.getenv("IMERG_ENABLED", "false").lower() == "true"
        self.username = os.getenv("NASA_EARTHDATA_USERNAME")
        self.password = os.getenv("NASA_EARTHDATA_PASSWORD")
        self.cache_minutes = int(os.getenv("IMERG_CACHE_MINUTES", "30"))
        
        # Example bounding box for Himachal Pradesh (Mandi/Beas region)
        self.lat = 31.58
        self.lon = 76.93

    def fetch(self, **kwargs):
        if not self.enabled or not self.username or not self.password:
            raise ValueError("IMERG integration is disabled or missing credentials")

        cache_key = "imerg_precipitation"
        cached = get_cached(cache_key)
        if cached:
            return cached

        # Using PMM Publisher API OpenSearch endpoint
        url = "https://pmmpublisher.pps.eosdis.nasa.gov/opensearch"
        params = {
            "q": "precip_30mn",
            "lat": self.lat,
            "lon": self.lon,
            "limit": 1
        }
        
        response = requests.get(url, params=params, auth=(self.username, self.password), timeout=10)
        response.raise_for_status()
        data = response.json()
        set_cached(cache_key, data, ttl_seconds=self.cache_minutes * 60)
        return data

    def validate(self, raw_data):
        if not raw_data: return False
        if "items" in raw_data and len(raw_data["items"]) > 0:
            return True
        return False

    def normalize(self, raw_data):
        item = raw_data["items"][0]
        # Example parsing of precipitation value from NASA response
        precip_value = item.get("properties", {}).get("precipitation", 0.0)
        
        return NormalizedObservation(
            source="NASA GPM IMERG",
            source_type="PUBLIC",
            variable="precipitation",
            value=float(precip_value),
            unit="mm/hr",
            latitude=self.lat,
            longitude=self.lon,
            observed_at=datetime.utcnow(),
            quality="NASA Early Run",
            raw_reference=item
        )

    def fallback(self, **kwargs):
        return NormalizedObservation(
            source="NASA GPM IMERG",
            source_type="SIMULATED",
            variable="precipitation",
            value=12.5,
            unit="mm/hr",
            latitude=self.lat,
            longitude=self.lon,
            observed_at=datetime.utcnow(),
            quality="Deterministic Demo Fallback",
            raw_reference={"status": "fallback"}
        )
