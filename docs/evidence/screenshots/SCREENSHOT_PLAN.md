# Screenshot Plan

To provide comprehensive evidence of the FlashGuard AI system for SIH judging, capture the following screenshots exactly from the running application:

### 1. 01-dashboard.png
- **Page**: `/`
- **UI State**: Default load, Map rendering, Priorities listed.
- **Visible**: Command Center title, live KPI numbers (Critical/High Risk), MapLibre component showing points, sorted Response Priority list.
- **Why it matters**: Demonstrates a unified view, integration of data streams, and clear operational readiness.

### 2. 02-risk-map.png
- **Page**: `/risk-map`
- **UI State**: Full screen map view with points.
- **Visible**: The color-coded risk points (Green, Yellow, Orange, Red) against the map tiles.
- **Why it matters**: Proves spatial situational awareness capability.

### 3. 03-location-explainability.png
- **Page**: `/risk-map`
- **UI State**: Drawer opened by clicking a red (Critical) location point.
- **Visible**: The Risk Score, Risk Band, Risk Drivers with their raw values (e.g. `45.2mm/hr`), and textual explanation.
- **Why it matters**: Highlights the "Explainable AI" component, proving the system provides reasoning, not just black-box scores.

### 4. 04-catchment-context.png
- **Page**: `/risk-map`
- **UI State**: Drawer opened on a location, scrolling down to Catchment Summary.
- **Visible**: Upstream Context box, Catchment stats (Avg rainfall, slope, saturation).
- **Why it matters**: Proves the digital twin concept—understanding how surrounding geography impacts local risk.

### 5. 05-scenario-baseline.png
- **Page**: `/scenarios`
- **UI State**: Default load before adjustments.
- **Visible**: Sliders at 1.0x, table showing Baseline Score == Scenario Score, and Risk Delta of 0.0.
- **Why it matters**: Establishes the baseline state for the what-if simulation tool.

### 6. 06-scenario-after.png
- **Page**: `/scenarios`
- **UI State**: Sliders adjusted (e.g., Rainfall +50%, Saturation +20%), "Run Scenario" clicked.
- **Visible**: Table updated, Risk Deltas showing positive values (e.g. +15.2), and Rank Deltas showing how priority shifted.
- **Why it matters**: Proves proactive planning capability, allowing authorities to model storm impact before it happens.

### 7. 07-priority-center.png
- **Page**: `/priorities`
- **UI State**: Default load.
- **Visible**: Table or list of locations sorted exactly by Priority Score, showing Hazard, Exposure, and Time Criticality components.
- **Why it matters**: Solves the core problem: Where to send limited rescue teams first.

### 8. 08-alert-center.png
- **Page**: `/alerts`
- **UI State**: Default load.
- **Visible**: List of NEW or ACKNOWLEDGED alerts with severity badges and timestamped reasons.
- **Why it matters**: Proves automated deterministic alert generation based on risk thresholds.

### 9. 09-evacuation-planner.png
- **Page**: `/evacuation`
- **UI State**: Origin and Destination selected, "Find Routes" clicked.
- **Visible**: Map showing routes, sidebar comparing "Route A" vs "Route B" including Flood Exposure levels (e.g. HIGH vs LOW) and Recommendation badge.
- **Why it matters**: Demonstrates actionable outcome. Safe routing saves lives during flash floods.

### 10. 10-api-swagger.png
- **Page**: `http://localhost:8000/docs`
- **UI State**: Default load of FastAPI Swagger UI.
- **Visible**: The list of all GET/POST endpoints under `/api`.
- **Why it matters**: Technical proof of a robust, modern backend REST architecture.
