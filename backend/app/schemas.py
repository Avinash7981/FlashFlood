from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
from app.models import AlertSeverity

class TopDriver(BaseModel):
    factor: str
    contribution: str
    raw_value: str

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: dict
    properties: dict

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

class ScenarioRequest(BaseModel):
    rainfall_modifier: float = Field(..., ge=0.8, le=1.5)
    saturation_modifier: float = Field(..., ge=0.8, le=1.3)

class ScenarioResponse(BaseModel):
    location_id: int
    location_name: str
    baseline_score: float
    scenario_score: float
    score_delta: float
    baseline_band: AlertSeverity
    scenario_band: AlertSeverity
    changed_drivers: List[TopDriver]
    explanation: str
    baseline_priority_score: float
    scenario_priority_score: float
    baseline_rank: int
    scenario_rank: int
    rank_delta: int
    data_mode: str
    provenance: Optional[dict] = None
    geom: Optional[dict] = None

class AlertResponse(BaseModel):
    id: int
    location_id: int
    location_name: str
    severity: str
    reason: str
    status: str
    timestamp: datetime
    risk_score: float
    risk_band: AlertSeverity
    top_risk_drivers: List[TopDriver]
    explanation: str
    data_mode: str
    provenance: Optional[dict] = None

class EvacuationRequest(BaseModel):
    origin_id: int
    destination_id: int

class EvacuationResponse(BaseModel):
    routes: GeoJSONFeatureCollection
    recommended_route_id: str

class PriorityResponse(BaseModel):
    location_id: int
    location_name: str
    priority_score: float
    priority_rank: int
    risk_score: float
    risk_band: AlertSeverity
    hazard_component: float
    exposure_component: float
    vulnerability_component: float
    time_criticality_component: float
    estimated_escalation_window: str
    top_risk_drivers: List[TopDriver]
    explanation: str
    data_mode: str
    provenance: Optional[dict] = None
    geom: Optional[dict] = None

class EvacuationRequest(BaseModel):
    origin_id: int
    destination_id: int

class RouteOption(BaseModel):
    id: str
    geometry: dict
    distance: str
    duration: str
    flood_exposure: str
    source: str
    recommendation: bool

class EvacuationResponse(BaseModel):
    origin: dict
    destination: dict
    routes: List[RouteOption]
    data_mode: str
