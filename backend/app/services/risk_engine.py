from app.models import AlertSeverity

def calculate_baseline_risk(rainfall_mm_hr: float, soil_saturation_pct: float, slope_pct: float, historical_susceptibility: float, provenance: dict = None) -> dict:
    """
    Explainable Deterministic Baseline Risk Engine.
    Inputs:
    - rainfall_mm_hr: 0 to 100+ mm/hr
    - soil_saturation_pct: 0.0 to 100.0
    - slope_pct: 0.0 to 100.0
    - historical_susceptibility: 0.0 to 1.0
    
    Output:
    - risk_score: 0-100
    - risk_band: AlertSeverity
    - top_drivers: list of dicts (name, contribution)
    - explanation: str
    - provenance: dict
    """
    
    # Normalization (Max Caps)
    norm_rain = min(rainfall_mm_hr / 100.0, 1.0)
    norm_soil = min(soil_saturation_pct / 100.0, 1.0)
    norm_slope = min(slope_pct / 60.0, 1.0) # Slope > 60% is essentially max hazard
    norm_hist = min(historical_susceptibility, 1.0)
    
    # Weighted Sum (sum of weights = 1.0)
    w_rain = 0.40
    w_soil = 0.35
    w_slope = 0.15
    w_hist = 0.10
    
    score_rain = norm_rain * w_rain * 100
    score_soil = norm_soil * w_soil * 100
    score_slope = norm_slope * w_slope * 100
    score_hist = norm_hist * w_hist * 100
    
    risk_score = round(score_rain + score_soil + score_slope + score_hist, 1)
    
    # Determine Band
    if risk_score <= 20:
        band = AlertSeverity.LOW
    elif risk_score <= 40:
        band = AlertSeverity.WATCH
    elif risk_score <= 60:
        band = AlertSeverity.HIGH
    else:
        band = AlertSeverity.CRITICAL
        
    # Explainability
    factors = [
        {"name": "Rainfall intensity", "value": score_rain, "norm": norm_rain, "raw": rainfall_mm_hr, "unit": "mm/hr"},
        {"name": "Soil saturation", "value": score_soil, "norm": norm_soil, "raw": soil_saturation_pct, "unit": "%"},
        {"name": "Slope", "value": score_slope, "norm": norm_slope, "raw": slope_pct, "unit": "%"},
        {"name": "Historical susceptibility", "value": score_hist, "norm": norm_hist, "raw": historical_susceptibility, "unit": "index"}
    ]
    factors.sort(key=lambda x: x["value"], reverse=True)
    
    top_drivers = []
    explanation_parts = []
    for factor in factors:
        if factor["value"] > 5:
            if factor["norm"] > 0.7:
                level = "high"
            elif factor["norm"] > 0.4:
                level = "elevated"
            else:
                level = "moderate"
            
            top_drivers.append({
                "factor": factor["name"],
                "contribution": level,
                "raw_value": f"{factor['raw']}{factor['unit']}"
            })
            
            if factor["name"] == "Rainfall intensity":
                explanation_parts.append(f"{level} rainfall intensity")
            elif factor["name"] == "Soil saturation":
                explanation_parts.append(f"{level} soil saturation")
            elif factor["name"] == "Slope":
                if level == "high":
                    explanation_parts.append("a steep catchment")
                else:
                    explanation_parts.append("moderate slope")
            elif factor["name"] == "Historical susceptibility":
                explanation_parts.append(f"{level} historical susceptibility")
    
    if len(explanation_parts) >= 2:
        explanation = f"Risk is {band.value.lower()} primarily because of {explanation_parts[0]} combined with {explanation_parts[1]}."
        if len(explanation_parts) > 2:
             explanation = f"Risk is {band.value.lower()} primarily because of {explanation_parts[0]} combined with {explanation_parts[1]} and {explanation_parts[2]}."
    elif len(explanation_parts) == 1:
        explanation = f"Risk is {band.value.lower()} primarily because of {explanation_parts[0]}."
    else:
        explanation = "Risk is low with no significant driving factors."
        
    return {
        "risk_score": risk_score,
        "risk_band": band,
        "top_drivers": top_drivers,
        "explanation": explanation,
        "provenance": provenance or {}
    }

def calculate_priority(hazard_score: float, exposure_index: float, vulnerability_index: float) -> dict:
    # Derive Time Criticality from hazard
    if hazard_score > 60:
        time_criticality = 1.0
        escalation_window = "30-45 min"
        tc_desc = "short lead-time"
    elif hazard_score > 40:
        time_criticality = 0.7
        escalation_window = "2-4 hours"
        tc_desc = "moderate lead-time"
    else:
        time_criticality = 0.1
        escalation_window = "N/A"
        tc_desc = "low time-criticality"
        
    norm_hazard = hazard_score / 100.0
    priority_score = norm_hazard * exposure_index * vulnerability_index * time_criticality
    
    # Generate explanation
    reasons = []
    if norm_hazard >= 0.5: reasons.append("high modelled hazard")
    if exposure_index >= 0.7: reasons.append("high exposed population")
    if vulnerability_index >= 0.7: reasons.append("high infrastructural vulnerability")
    if time_criticality >= 0.7: reasons.append(tc_desc)
    
    if len(reasons) >= 2:
        reason_str = f"{reasons[0].capitalize()} combined with {reasons[1]}."
        if len(reasons) > 2:
            reason_str = f"{reasons[0].capitalize()}, {reasons[1]}, and {reasons[2]}."
    elif len(reasons) == 1:
        reason_str = f"{reasons[0].capitalize()}."
    else:
        reason_str = "Standard priority level based on nominal factors."
        
    return {
        "priority_score": round(priority_score, 2), # 0-1
        "hazard_component": round(norm_hazard, 2),
        "exposure_component": round(exposure_index, 2),
        "vulnerability_component": round(vulnerability_index, 2),
        "time_criticality_component": round(time_criticality, 2),
        "estimated_escalation_window": escalation_window,
        "explanation": reason_str
    }

