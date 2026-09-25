# API Endpoints Evidence

The backend is built with FastAPI and provides an automatically generated Swagger UI locally at `http://localhost:8000/docs`.

| Method | Endpoint | Purpose | Verified |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/dashboard/summary` | Top-level summary statistics | ✅ Yes |
| **GET** | `/api/risk` | GeoJSON collection of all locations and current risk | ✅ Yes |
| **GET** | `/api/locations/{id}` | Detailed risk, catchment, and explainability for a location | ✅ Yes |
| **GET** | `/api/locations` | List of all locations | ✅ Yes |
| **POST** | `/api/scenarios/run` | Runs simulation recalculations with modifiers | ✅ Yes |
| **GET** | `/api/priorities` | Sorted locations by priority score (Hazard x Exposure x Vuln) | ✅ Yes |
| **GET** | `/api/alerts` | Fetches active alerts, generating new ones deterministically | ✅ Yes |
| **POST** | `/api/alerts/{id}/acknowledge` | Marks an alert as acknowledged | ✅ Yes |
| **POST** | `/api/evacuation/route` | Returns evacuation routes comparing flood exposure | ✅ Yes |
| **GET** | `/health` | Basic health check | ✅ Yes |
