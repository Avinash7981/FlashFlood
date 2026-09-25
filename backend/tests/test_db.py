import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import engine, SessionLocal
from app.models import User, Catchment, Location

def test_database():
    print("Testing Database Connectivity and Data...")
    db = SessionLocal()
    try:
        # Check PostGIS
        res = db.execute(text("SELECT postgis_version();")).fetchone()
        print(f"PostGIS Version: {res[0]}")
        
        # Check Data Counts
        users = db.query(User).count()
        catchments = db.query(Catchment).count()
        locations = db.query(Location).count()
        print(f"Users: {users}, Catchments: {catchments}, Locations: {locations}")
        assert users == 4, "Missing demo users"
        assert catchments == 2, "Missing catchments"
        assert locations == 3, "Missing locations"
        
        # Check Spatial Query
        query = text("""
            SELECT c.name FROM catchments c
            WHERE ST_Contains(c.geom, ST_GeomFromText('POINT(77.2 31.35)', 4326))
        """)
        containing_catchment = db.execute(query).fetchone()
        print(f"Catchment containing Village A point: {containing_catchment[0] if containing_catchment else 'None'}")
        assert containing_catchment is not None, "Spatial query failed"
        assert "Upper" in containing_catchment[0]

        print("All database tests passed successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    test_database()
