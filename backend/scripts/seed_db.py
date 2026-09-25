import os
import sys

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import engine, Base, SessionLocal
from app.models import (
    User, UserRole, Region, Catchment, Location, DataSource, DataMode,
    Observation, AlertSeverity, RiskResult, Route, Alert
)
import bcrypt
from datetime import datetime, timezone



def seed_data(db: Session):
    print("Clearing existing data...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    print("Seeding users...")
    demo_users = [
        User(email="admin@flashguard.demo", hashed_password=bcrypt.hashpw(b"demo123", bcrypt.gensalt()).decode("utf-8"), role=UserRole.ADMIN),
        User(email="manager@flashguard.demo", hashed_password=bcrypt.hashpw(b"demo123", bcrypt.gensalt()).decode("utf-8"), role=UserRole.MANAGER),
        User(email="responder@flashguard.demo", hashed_password=bcrypt.hashpw(b"demo123", bcrypt.gensalt()).decode("utf-8"), role=UserRole.RESPONDER),
        User(email="viewer@flashguard.demo", hashed_password=bcrypt.hashpw(b"demo123", bcrypt.gensalt()).decode("utf-8"), role=UserRole.VIEWER)
    ]
    db.add_all(demo_users)
    db.commit()

    print("Seeding data sources...")
    data_sources = [
        DataSource(name="Weather & Rainfall", type="Meteorological", status=DataMode.SIMULATED, provenance="Deterministic Prototype Simulator"),
        DataSource(name="Soil Moisture Network", type="IoT", status=DataMode.SIMULATED, provenance="Simulated Sensor Data"),
        DataSource(name="Catchment Topography", type="DEM", status=DataMode.DERIVED, provenance="Static SRTM Dataset"),
    ]
    db.add_all(data_sources)
    db.commit()

    print("Seeding regions and catchments...")
    # Geometry for region (polygon roughly spanning demo area)
    region_geom = "SRID=4326;POLYGON((77.0 31.0, 77.5 31.0, 77.5 31.5, 77.0 31.5, 77.0 31.0))"
    region1 = Region(name="North District", geom=region_geom)
    db.add(region1)
    db.commit()

    # Catchment A (Upstream)
    catchment_a = Catchment(
        name="Catchment A (Upper)", region_id=region1.id, 
        geom="SRID=4326;POLYGON((77.1 31.3, 77.3 31.3, 77.3 31.4, 77.1 31.4, 77.1 31.3))",
        upstream_ids=[], elevation_range="1200-2000m", avg_slope=22.5
    )
    # Catchment B (Downstream)
    catchment_b = Catchment(
        name="Catchment B (Lower)", region_id=region1.id,
        geom="SRID=4326;POLYGON((77.1 31.1, 77.3 31.1, 77.3 31.3, 77.1 31.3, 77.1 31.1))",
        upstream_ids=[1], elevation_range="500-1200m", avg_slope=15.0
    )
    db.add_all([catchment_a, catchment_b])
    db.commit()

    print("Seeding locations (villages)...")
    village_a = Location(
        name="Village A", catchment_id=catchment_a.id, geom="SRID=4326;POINT(77.2 31.35)",
        population=450, exposure_index=0.4, vulnerability_index=0.5
    )
    village_b = Location(
        name="Village B", catchment_id=catchment_b.id, geom="SRID=4326;POINT(77.2 31.25)",
        population=1200, exposure_index=0.9, vulnerability_index=0.8
    )
    village_c = Location(
        name="Village C (Safe Zone)", catchment_id=catchment_b.id, geom="SRID=4326;POINT(77.15 31.15)",
        population=3000, exposure_index=0.1, vulnerability_index=0.1
    )
    db.add_all([village_a, village_b, village_c])
    db.commit()

    print("Seeding observations (IoT)...")
    observations = [
        Observation(sensor_id="RG-001", type="Rain Gauge", location_id=village_a.id, geom="SRID=4326;POINT(77.21 31.36)", current_value=45.0, unit="mm/hr", data_mode=DataMode.SIMULATED),
        Observation(sensor_id="SM-001", type="Soil Moisture", location_id=village_a.id, geom="SRID=4326;POINT(77.22 31.36)", current_value=75.0, unit="%", data_mode=DataMode.SIMULATED),
        Observation(sensor_id="RG-002", type="Rain Gauge", location_id=village_b.id, geom="SRID=4326;POINT(77.19 31.26)", current_value=20.0, unit="mm/hr", data_mode=DataMode.SIMULATED),
    ]
    db.add_all(observations)
    db.commit()

    print("Seeding initial risk results...")
    risks = [
        RiskResult(location_id=village_a.id, risk_score=76.0, risk_band=AlertSeverity.HIGH, drivers=["High rainfall", "Steep terrain"]),
        RiskResult(location_id=village_b.id, risk_score=40.0, risk_band=AlertSeverity.WATCH, drivers=["Downstream location", "Moderate saturation"]),
        RiskResult(location_id=village_c.id, risk_score=15.0, risk_band=AlertSeverity.LOW, drivers=["Safe elevation", "Low rainfall"]),
    ]
    db.add_all(risks)
    db.commit()
    
    print("Database seeded successfully with deterministic demo data.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
