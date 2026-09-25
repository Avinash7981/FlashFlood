from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from geoalchemy2.shape import to_shape
import json

from app.db.database import get_db
from app.models import Location, RiskResult, Alert, DataMode, Observation, Catchment, AlertSeverity
from app.schemas import PriorityResponse, GeoJSONFeatureCollection, GeoJSONFeature, ScenarioRequest, ScenarioResponse, AlertResponse, EvacuationRequest, EvacuationResponse, RouteOption
from app.services.risk_engine import calculate_baseline_risk, calculate_priority
from app.services.data_sources.registry import get_current_rainfall, get_current_exposure, get_data_sources_status

def get_location_risk_inputs(loc, db_rain, db_soil):
    current_rain = get_current_rainfall()
    current_exp = get_current_exposure()
    used_rain = current_rain.value if current_rain.source_type == 'PUBLIC' else db_rain
    used_exp = current_exp.value if current_exp.source_type == 'PUBLIC' else loc.exposure_index
    provenance = {
        'rainfall': {'source': current_rain.source if current_rain.source_type == 'PUBLIC' else 'Deterministic Demo', 'source_type': current_rain.source_type if current_rain.source_type == 'PUBLIC' else 'SIMULATED', 'value': used_rain, 'unit': 'mm/hr'},
        'exposure': {'source': current_exp.source if current_exp.source_type == 'PUBLIC' else 'Deterministic Demo', 'source_type': current_exp.source_type if current_exp.source_type == 'PUBLIC' else 'SIMULATED', 'value': used_exp, 'unit': 'index'},
        'terrain': {'source': 'Copernicus DEM', 'source_type': 'DERIVED', 'value': loc.catchment.avg_slope, 'unit': '%'}
    }
    return used_rain, db_soil, used_exp, provenance


router = APIRouter()

@router.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_locations = db.query(Location).count()
    risks = db.query(RiskResult).all()
    alerts = db.query(Alert).filter(Alert.status == "NEW").count()
    
    critical_count = sum(1 for r in risks if r.risk_band.name == "CRITICAL")
    high_count = sum(1 for r in risks if r.risk_band.name == "HIGH")
    
    avg_risk = sum(r.risk_score for r in risks) / len(risks) if risks else 0
    highest = max(risks, key=lambda r: r.risk_score) if risks else None
    
    return {
        "total_monitored_locations": total_locations,
        "critical_locations": critical_count,
        "high_risk_locations": high_count,
        "active_alerts": alerts,
        "average_risk": round(avg_risk, 1),
        "highest_risk_location": highest.location.name if highest else None,
        "data_source_status": "Real-Data Integration Active",
        "last_updated_timestamp": highest.timestamp if highest else None
    }

@router.get("/risk", response_model=GeoJSONFeatureCollection)
def get_risk_map(db: Session = Depends(get_db)):
    locations = db.query(Location).all()
    features = []
    for loc in locations:
        risk = db.query(RiskResult).filter(RiskResult.location_id == loc.id).order_by(RiskResult.timestamp.desc()).first()
        geom = to_shape(loc.geom)
        features.append(GeoJSONFeature(
            geometry={"type": "Point", "coordinates": [geom.x, geom.y]},
            properties={
                "location_id": loc.id,
                "location_name": loc.name,
                "risk_score": risk.risk_score if risk else 0,
                "risk_band": risk.risk_band.name if risk else "LOW",
                "major_drivers": risk.drivers if risk else [],
                "data_mode": DataMode.SIMULATED.value
            }
        ))
    return GeoJSONFeatureCollection(features=features)

@router.get("/locations/{id}")
def get_location_details(id: int, db: Session = Depends(get_db)):
    from shapely.geometry import mapping
    loc = db.query(Location).filter(Location.id == id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
        
    risk = db.query(RiskResult).filter(RiskResult.location_id == loc.id).order_by(RiskResult.timestamp.desc()).first()
    geom = to_shape(loc.geom)
    catchment_geom = to_shape(loc.catchment.geom)
    
    # Fetch base observations to regenerate explanation
    rain_obs = db.query(Observation).filter(Observation.location_id == loc.id, Observation.type == "Rain Gauge").first()
    soil_obs = db.query(Observation).filter(Observation.location_id == loc.id, Observation.type == "Soil Moisture").first()
    
    base_rain = rain_obs.current_value if rain_obs else 10.0
    base_soil = soil_obs.current_value if soil_obs else 30.0
    
    used_rain, used_soil, used_exp, prov = get_location_risk_inputs(loc, base_rain, base_soil)
    
    # Re-calculate to get rich explanation and drivers array
    calc_res = calculate_baseline_risk(used_rain, used_soil, loc.catchment.avg_slope, 0.5, provenance=prov)
    
    # Build upstream downstream explanation
    upstream_desc = "Standard catchment context"
    if len(loc.catchment.upstream_ids) > 0:
         upstream_desc = f"Risk at {loc.name} is elevated partially because rainfall and soil saturation within its upstream catchments are elevated."
    else:
         if calc_res["risk_score"] > 40:
              upstream_desc = f"Catchment context indicates local accumulation is the primary driver for {loc.name}."
    
    return {
        "location_information": {"id": loc.id, "name": loc.name},
        "geometry": mapping(geom),
        "current_risk": risk.risk_score if risk else 0,
        "risk_band": risk.risk_band.name if risk else "LOW",
        "risk_drivers": calc_res["top_drivers"],
        "explanation": calc_res["explanation"],
        "upstream_downstream_explanation": upstream_desc,
        "catchment_information": {
            "id": loc.catchment.id, 
            "name": loc.catchment.name, 
            "slope": loc.catchment.avg_slope,
            "geometry": mapping(catchment_geom),
            "average_rainfall": base_rain,
            "average_soil": base_soil,
            "monitored_locations": len(loc.catchment.locations)
        },
        "upstream_context": {"upstream_ids": loc.catchment.upstream_ids},
        "exposure": loc.exposure_index,
        "vulnerability": loc.vulnerability_index,
        "estimated_escalation_window": "30-45 min" if (risk and risk.risk_score > 60) else "N/A",
        "data_provenance": calc_res["provenance"]
    }
@router.post("/scenarios/run", response_model=List[ScenarioResponse])
def run_scenario(request: ScenarioRequest, db: Session = Depends(get_db)):
    from shapely.geometry import mapping
    locations = db.query(Location).all()
    
    baseline_list = []
    scenario_list = []
    
    # First pass: calculate scores
    for loc in locations:
        risk = db.query(RiskResult).filter(RiskResult.location_id == loc.id).order_by(RiskResult.timestamp.desc()).first()
        baseline_score = risk.risk_score if risk else 0.0
        baseline_band = risk.risk_band if risk else AlertSeverity.LOW
        
        rain_obs = db.query(Observation).filter(Observation.location_id == loc.id, Observation.type == "Rain Gauge").first()
        soil_obs = db.query(Observation).filter(Observation.location_id == loc.id, Observation.type == "Soil Moisture").first()
        
        base_rain = rain_obs.current_value if rain_obs else 10.0
        base_soil = soil_obs.current_value if soil_obs else 30.0
        
        used_rain, used_soil, used_exp, prov = get_location_risk_inputs(loc, base_rain, base_soil)
        
        scen_rain = used_rain * request.rainfall_modifier
        scen_soil = used_soil * request.saturation_modifier
        
        scen_res = calculate_baseline_risk(scen_rain, scen_soil, loc.catchment.avg_slope, 0.5, provenance=prov)
        geom = to_shape(loc.geom)
        
        base_p = calculate_priority(baseline_score, loc.exposure_index, loc.vulnerability_index)
        scen_p = calculate_priority(scen_res["risk_score"], used_exp, loc.vulnerability_index)
        
        item = {
            "location_id": loc.id,
            "location_name": loc.name,
            "baseline_score": baseline_score,
            "scenario_score": scen_res["risk_score"],
            "score_delta": round(scen_res["risk_score"] - baseline_score, 1),
            "baseline_band": baseline_band,
            "scenario_band": scen_res["risk_band"],
            "changed_drivers": scen_res["top_drivers"],
            "explanation": scen_res["explanation"],
            "baseline_priority_score": base_p["priority_score"],
            "scenario_priority_score": scen_p["priority_score"],
            "data_mode": DataMode.SIMULATED.value,
            "provenance": scen_res["provenance"],
            "geom": mapping(geom)
        }
        baseline_list.append(item)
        scenario_list.append(item)
        
    # Rank baselines
    baseline_list.sort(key=lambda x: x["baseline_priority_score"], reverse=True)
    base_ranks = {item["location_id"]: rank for rank, item in enumerate(baseline_list, 1)}
    
    # Rank scenarios
    scenario_list.sort(key=lambda x: x["scenario_priority_score"], reverse=True)
    
    responses = []
    for rank, item in enumerate(scenario_list, 1):
        b_rank = base_ranks[item["location_id"]]
        responses.append(ScenarioResponse(
            **item,
            baseline_rank=b_rank,
            scenario_rank=rank,
            rank_delta=b_rank - rank # Positive means it moved UP in priority (e.g. #4 to #1 is +3)
        ))
        
    return responses

@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    # 1. Deterministic Alert Generation
    locations = db.query(Location).all()
    for loc in locations:
        risk = db.query(RiskResult).filter(RiskResult.location_id == loc.id).order_by(RiskResult.timestamp.desc()).first()
        if risk and risk.risk_band in [AlertSeverity.HIGH, AlertSeverity.CRITICAL]:
            # Check if there is already a NEW alert for this location and severity
            existing = db.query(Alert).filter(
                Alert.location_id == loc.id,
                Alert.status == "NEW",
                Alert.severity == risk.risk_band
            ).first()
            if not existing:
                reason = f"Risk escalated to {risk.risk_band.name}. Drivers: " + ", ".join([d["factor"] if isinstance(d, dict) else str(d) for d in risk.drivers])
                new_alert = Alert(
                    location_id=loc.id,
                    severity=risk.risk_band,
                    reason=reason
                )
                db.add(new_alert)
    db.commit()

    # 2. Fetch and enrich alerts
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).all()
    res = []
    for a in alerts:
        risk = db.query(RiskResult).filter(RiskResult.location_id == a.location_id).order_by(RiskResult.timestamp.desc()).first()
        
        # Recreate explanation using engine since RiskResult doesn't store the rich text
        p = calculate_priority(risk.risk_score if risk else 0.0, a.location.exposure_index, a.location.vulnerability_index)
        
        drivers = risk.drivers if risk else []
        mapped_drivers = [d if isinstance(d, dict) else {"factor": str(d), "contribution": "N/A", "raw_value": "N/A"} for d in drivers]
        
        res.append(AlertResponse(
            id=a.id,
            location_id=a.location_id,
            location_name=a.location.name,
            severity=a.severity.name,
            reason=a.reason,
            status=a.status,
            timestamp=a.timestamp,
            risk_score=risk.risk_score if risk else 0.0,
            risk_band=risk.risk_band if risk else AlertSeverity.LOW,
            top_risk_drivers=mapped_drivers,
            explanation=p["explanation"],
            data_mode=DataMode.SIMULATED.value
        ))
    return res

@router.post("/alerts/{id}/acknowledge")
def acknowledge_alert(id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "ACKNOWLEDGED"
    db.commit()
    return {"status": "success", "alert_id": id}

@router.post("/evacuation/route", response_model=EvacuationResponse)
def get_evacuation_route(request: EvacuationRequest, db: Session = Depends(get_db)):
    import requests
    from shapely.geometry import mapping
    from geoalchemy2.shape import to_shape
    
    orig = db.query(Location).filter(Location.id == request.origin_id).first()
    dest = db.query(Location).filter(Location.id == request.destination_id).first()
    
    if not orig or not dest:
        raise HTTPException(status_code=400, detail="Invalid origin or destination")
        
    orig_geom = to_shape(orig.geom)
    dest_geom = to_shape(dest.geom)
    
    routes = []
    
    # Try OSRM
    try:
        url = f"http://router.project-osrm.org/route/v1/driving/{orig_geom.x},{orig_geom.y};{dest_geom.x},{dest_geom.y}?geometries=geojson&alternatives=true"
        resp = requests.get(url, timeout=2)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok" and "routes" in data:
                for idx, r in enumerate(data["routes"]):
                    dist_km = r["distance"] / 1000.0
                    dur_min = r["duration"] / 60.0
                    # Simulate exposure - first route is usually shortest, we'll make it HIGH exposure if >1 route
                    exposure = "HIGH" if idx == 0 and len(data["routes"]) > 1 else "LOW"
                    routes.append(RouteOption(
                        id=f"osrm_route_{idx}",
                        geometry=r["geometry"],
                        distance=f"{dist_km:.1f} km",
                        duration=f"{int(dur_min)} min",
                        flood_exposure=exposure,
                        source="EXTERNAL ROUTING",
                        recommendation=(exposure == "LOW")
                    ))
    except:
        pass
        
    # Fallback to deterministic demo if no routes found
    if not routes:
        # Route A: Direct (High exposure)
        # Route B: Detour (Low exposure)
        mid_x = (orig_geom.x + dest_geom.x) / 2
        mid_y = (orig_geom.y + dest_geom.y) / 2
        
        routes = [
            RouteOption(
                id="demo_fallback_A",
                geometry={"type": "LineString", "coordinates": [[orig_geom.x, orig_geom.y], [dest_geom.x, dest_geom.y]]},
                distance="4.2 km",
                duration="11 min",
                flood_exposure="HIGH",
                source="DEMO FALLBACK",
                recommendation=False
            ),
            RouteOption(
                id="demo_fallback_B",
                geometry={"type": "LineString", "coordinates": [[orig_geom.x, orig_geom.y], [mid_x + 0.05, mid_y + 0.05], [dest_geom.x, dest_geom.y]]},
                distance="4.8 km",
                duration="13 min",
                flood_exposure="LOW",
                source="DEMO FALLBACK",
                recommendation=True
            )
        ]
        
    return EvacuationResponse(
        origin={"id": orig.id, "name": orig.name, "coordinates": [orig_geom.x, orig_geom.y]},
        destination={"id": dest.id, "name": dest.name, "coordinates": [dest_geom.x, dest_geom.y]},
        routes=routes,
        data_mode=DataMode.SIMULATED.value
    )

@router.get("/priorities", response_model=List[PriorityResponse])
def get_priorities(db: Session = Depends(get_db)):
    locations = db.query(Location).all()
    res = []
    
    # Calculate all priorities first
    for loc in locations:
        risk = db.query(RiskResult).filter(RiskResult.location_id == loc.id).order_by(RiskResult.timestamp.desc()).first()
        if risk:
            # Re-fetch observations for rich drivers if needed, but we can just use risk.drivers
            p = calculate_priority(risk.risk_score, loc.exposure_index, loc.vulnerability_index)
            res.append({
                "location_id": loc.id,
                "location_name": loc.name,
                "priority_score": p["priority_score"],
                "risk_score": risk.risk_score,
                "risk_band": risk.risk_band,
                "hazard_component": p["hazard_component"],
                "exposure_component": p["exposure_component"],
                "vulnerability_component": p["vulnerability_component"],
                "time_criticality_component": p["time_criticality_component"],
                "estimated_escalation_window": p["estimated_escalation_window"],
                "top_risk_drivers": risk.drivers,
                "explanation": p["explanation"],
                "geom": mapping(to_shape(loc.geom)),
                "data_mode": DataMode.SIMULATED.value
            })
            
    # Sort and assign rank
    res.sort(key=lambda x: x["priority_score"], reverse=True)
    final_res = []
    for rank, item in enumerate(res, 1):
        item["priority_rank"] = rank
        final_res.append(PriorityResponse(**item))
        
    return final_res

@router.get("/locations")
def get_all_locations(db: Session = Depends(get_db)):
    locs = db.query(Location).all()
    return [{"id": l.id, "name": l.name, "is_safe_zone": "Safe Zone" in l.name} for l in locs]


@router.get("/data-sources/status")
def get_data_sources_status_api():
    return get_data_sources_status()
