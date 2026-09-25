from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime

class NormalizedObservation:
    def __init__(self, source: str, source_type: str, variable: str, value: float, unit: str, 
                 latitude: Optional[float] = None, longitude: Optional[float] = None, 
                 observed_at: Optional[datetime] = None, quality: str = "UNKNOWN", 
                 raw_reference: Optional[Dict] = None):
        self.source = source
        self.source_type = source_type
        self.variable = variable
        self.value = value
        self.unit = unit
        self.latitude = latitude
        self.longitude = longitude
        self.observed_at = observed_at or datetime.utcnow()
        self.quality = quality
        self.raw_reference = raw_reference or {}

    def to_dict(self):
        return {
            "source": self.source,
            "source_type": self.source_type,
            "variable": self.variable,
            "value": self.value,
            "unit": self.unit,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "observed_at": self.observed_at.isoformat() if self.observed_at else None,
            "quality": self.quality,
            "raw_reference": self.raw_reference
        }

class DataSourceAdapter(ABC):
    @abstractmethod
    def fetch(self, **kwargs) -> Any:
        pass

    @abstractmethod
    def normalize(self, raw_data: Any) -> NormalizedObservation:
        pass

    @abstractmethod
    def validate(self, raw_data: Any) -> bool:
        pass

    @abstractmethod
    def fallback(self, **kwargs) -> NormalizedObservation:
        pass

    def get_data(self, **kwargs) -> NormalizedObservation:
        try:
            raw_data = self.fetch(**kwargs)
            if self.validate(raw_data):
                return self.normalize(raw_data)
            else:
                raise ValueError(f"Data validation failed for {self.__class__.__name__}")
        except Exception as e:
            # Log failure
            print(f"EXTERNAL SOURCE FAILURE [{self.__class__.__name__}]: {str(e)}")
            return self.fallback(**kwargs)
