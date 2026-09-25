# FlashGuard AI — SIH Evidence Checklist

## A. Dashboard Evidence
- **What to capture**: Main `/` route showing summary cards, risk map preview, and response priority list.
- **Why it proves the feature**: Demonstrates command center integration and live data fetching.
- **Screenshot**: `01-dashboard.png`

## B. Risk Map Evidence
- **What to capture**: Full screen `/risk-map` showing color-coded locations (Green, Yellow, Orange, Red).
- **Why it proves the feature**: Demonstrates spatial distribution and GIS rendering.
- **Screenshot**: `02-risk-map.png`

## C. Location/Explainability Evidence
- **What to capture**: The drawer opened in `/risk-map` for a high-risk location, showing risk drivers, explanation, and catchment details.
- **Why it proves the feature**: Proves the explainable risk engine works.
- **Screenshot**: `03-location-explainability.png`

## D. Catchment Digital Twin Evidence
- **What to capture**: The catchment boundary rendering and the catchment summary statistics in the location drawer.
- **Why it proves the feature**: Shows understanding of upstream/downstream context.
- **Screenshot**: `04-catchment-context.png`

## E. What-If Scenario Evidence
- **What to capture**: `/scenarios` page with sliders adjusted (e.g. 1.5x rainfall) and showing the score deltas in the table.
- **Why it proves the feature**: Proves dynamic recalculation of risk based on parameters.
- **Screenshots**: `05-scenario-baseline.png`, `06-scenario-after.png`

## F. Priority Center Evidence
- **What to capture**: `/priorities` page showing locations sorted by calculated priority score.
- **Why it proves the feature**: Shows decision-support ranking beyond pure hazard score.
- **Screenshot**: `07-priority-center.png`

## G. Alert Evidence
- **What to capture**: `/alerts` page showing active alerts with their explanations.
- **Why it proves the feature**: Shows automated deterministic alert generation.
- **Screenshot**: `08-alert-center.png`

## H. Evacuation Planner Evidence
- **What to capture**: `/evacuation` route calculation showing high-exposure vs low-exposure routes.
- **Why it proves the feature**: Proves routing capability with flood-awareness.
- **Screenshot**: `09-evacuation-planner.png`

## I. API/Swagger Evidence
- **What to capture**: `/docs` (FastAPI Swagger UI) showing all endpoints.
- **Why it proves the feature**: Shows robust backend architecture.
- **Screenshot**: `10-api-swagger.png`

## J. Database/PostGIS Evidence
- **What to capture**: A query output from PostgreSQL showing `geom` columns or SQLAlchemy models.
- **Why it proves the feature**: Demonstrates spatial data persistence.

## K. Testing Evidence
- **What to capture**: Terminal output of `pytest` passing successfully.
- **Why it proves the feature**: Shows code quality.

## L. Architecture Evidence
- **What to capture**: The markdown diagrams representing the system.
- **Why it proves the feature**: Explains technical complexity to judges.

## M. Data Provenance Evidence
- **What to capture**: The Data Provenance document outlining limitations and simulated data.
- **Why it proves the feature**: Demonstrates technical honesty.

## N. Limitations/Safety Evidence
- **What to capture**: UI elements indicating "Simulated Data" or "Demo Fallback".
- **Why it proves the feature**: Ensures safe application for emergency response.
