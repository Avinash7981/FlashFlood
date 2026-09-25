# Data Provenance & Limitations

## SIMULATED / DEMO Data
To validate the technical architecture and algorithms without live telemetry during the hackathon, the following data is explicitly marked as simulated or demo:
- **Rainfall & Soil Moisture**: Seeded via `seed_db.py`. Although the schema supports live sensors, the prototype values are deterministic mock data.
- **Evacuation Routes**: Uses OSRM public API where available, falling back to a geometric simulation of high/low flood exposure routes if the API is rate-limited.
- **Historical Susceptibility**: Seeded integer indices rather than live government geological surveys.
- **Vulnerability & Exposure Indices**: Generated as plausible mock index scores (0.0 to 1.0) rather than real demographic censuses.

## DERIVED Data
The following data is produced by FlashGuard's own logic:
- **Risk Score & Bands**: Calculated purely through the Explainable Deterministic Baseline Risk Engine (`risk_engine.py`) using weighted sums of inputs.
- **Priority Scores**: Derived by combining the hazard risk with the exposure and vulnerability indices.
- **Risk Driver Explanations**: Textual descriptions automatically synthesized from the input parameters crossing thresholds.

## LIVE / PUBLIC Data (Supported architecture)
- **MapLibre GL Maps**: Renders using standard vector/raster tiles in the frontend, representing real geography.
- **Future Integration**: The `DataSource` and `Observation` models in PostgreSQL are structured exactly as required to ingest standard live government telemetry (e.g. from IoT rain gauges or API webhooks) with fields for `unit`, `geom`, `timestamp`, and `status`.

## Limitations
- **Security**: The current prototype is open. Authentication endpoints and JWT protection are omitted for demo simplicity.
- **Catchment Twin**: A fully dynamic 3D hydrological model requires immense compute. We abstract this using deterministic algorithms and weighted equations over the defined `Catchment` polygon geometries.
