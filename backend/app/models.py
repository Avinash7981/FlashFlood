from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
import enum
from .db.database import Base

class DataMode(enum.Enum):
    LIVE = "LIVE"
    PUBLIC = "PUBLIC"
    SIMULATED = "SIMULATED"
    DERIVED = "DERIVED"
    UNAVAILABLE = "UNAVAILABLE"

class AlertSeverity(enum.Enum):
    LOW = "LOW"
    WATCH = "WATCH"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    RESPONDER = "RESPONDER"
    VIEWER = "VIEWER"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.VIEWER)
    is_active = Column(Boolean, default=True)

class DataSource(Base):
    __tablename__ = "data_sources"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    type = Column(String, nullable=False)
    status = Column(Enum(DataMode), default=DataMode.UNAVAILABLE)
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
    provenance = Column(String)

class Region(Base):
    __tablename__ = "regions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    geom = Column(Geometry("POLYGON", srid=4326), nullable=False)

    catchments = relationship("Catchment", back_populates="region")

class Catchment(Base):
    __tablename__ = "catchments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    geom = Column(Geometry("POLYGON", srid=4326), nullable=False)
    upstream_ids = Column(JSON, default=list) # List of upstream catchment IDs
    elevation_range = Column(String) # e.g., "500-1200m"
    avg_slope = Column(Float) # percentage

    region = relationship("Region", back_populates="catchments")
    locations = relationship("Location", back_populates="catchment")

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    catchment_id = Column(Integer, ForeignKey("catchments.id"), nullable=False)
    geom = Column(Geometry("POINT", srid=4326), nullable=False)
    
    # Impact Factors
    population = Column(Integer, default=0)
    exposure_index = Column(Float, default=0.0) # 0.0 to 1.0
    vulnerability_index = Column(Float, default=0.0) # 0.0 to 1.0

    catchment = relationship("Catchment", back_populates="locations")
    observations = relationship("Observation", back_populates="location")
    risk_results = relationship("RiskResult", back_populates="location")
    alerts = relationship("Alert", back_populates="location")

class Observation(Base):
    __tablename__ = "observations"
    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String, index=True, nullable=False)
    type = Column(String, nullable=False) # e.g., "Rain Gauge", "Soil Moisture"
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    geom = Column(Geometry("POINT", srid=4326), nullable=True)
    current_value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    status = Column(String, default="ONLINE")
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    data_mode = Column(Enum(DataMode), default=DataMode.SIMULATED)
    
    # New real data tracking fields
    source = Column(String, nullable=True)
    source_type = Column(Enum(DataMode), default=DataMode.SIMULATED)
    quality = Column(String, nullable=True)
    observed_at = Column(DateTime(timezone=True), nullable=True)
    raw_reference = Column(JSON, nullable=True)

    location = relationship("Location", back_populates="observations")

class HistoricalEvent(Base):
    __tablename__ = "historical_events"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    severity = Column(String)
    type = Column(String)
    source = Column(String)

class RiskResult(Base):
    __tablename__ = "risk_results"
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    risk_score = Column(Float, nullable=False) # 0.0 to 100.0
    risk_band = Column(Enum(AlertSeverity), nullable=False)
    drivers = Column(JSON, nullable=False) # e.g., ["High upstream rainfall", "Steep terrain"]
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    location = relationship("Location", back_populates="risk_results")

class Scenario(Base):
    __tablename__ = "scenarios"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rainfall_modifier = Column(Float, default=1.0) # e.g. 1.2 = +20%
    saturation_modifier = Column(Float, default=1.0)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, default="NEW") # NEW, ACKNOWLEDGED, RESOLVED
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    location = relationship("Location", back_populates="alerts")

class Route(Base):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    origin_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    destination_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    geom = Column(Geometry("LINESTRING", srid=4326), nullable=False)
    distance_km = Column(Float, nullable=False)
    eta_mins = Column(Integer, nullable=False)
    flood_exposure_level = Column(String, nullable=False) # LOW, HIGH
    data_mode = Column(Enum(DataMode), default=DataMode.SIMULATED)

