# FlashGuard AI

**Predict the Risk. Understand the Impact. Decide What Happens Next.**

FlashGuard AI is an operational, end-to-end decision-support prototype moving beyond static flood prediction into dynamic Flood Decision Intelligence. Designed for emergency responders and government bodies (e.g., SIH), it models how upstream conditions impact downstream risk, prioritizes response targets, simulates what-if scenarios, and generates deterministic evacuation routes based on modeled flood exposure.

---

## 🚀 Key Differentiators

1. **Catchment Digital Twin**: Contextualizes downstream exposure with upstream geographic reality.
2. **Explainable Risk**: Deterministic math models rather than black-box AI ensure trust.
3. **What-If Simulation**: Slide to adjust rainfall/saturation and watch the predicted risk dynamically shift.
4. **Dynamic Response Priority**: Converts hazard and vulnerability into an actionable, ranked operational response queue.
5. **Alert-to-Evacuation Workflow**: Links critical risk escalations natively to safe-zone routing via OSRM, actively factoring in modeled flood exposure.

---

## 🏗 Architecture & Stack

### Frontend
- **Framework**: Next.js 14 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS & `shadcn/ui`
- **Mapping**: MapLibre GL JS
- **State Management**: SWR for dynamic polling

### Backend
- **Framework**: FastAPI (Python 3.13)
- **Database**: PostgreSQL with PostGIS extension
- **ORM**: SQLAlchemy + GeoAlchemy2
- **Routing Integration**: OSRM API (Project OSRM)

---

## ⚙️ Native Setup Instructions

### Prerequisites
1. **Python 3.13+**
2. **Node.js 20+** and `npm`
3. **PostgreSQL** with **PostGIS** extension enabled natively (e.g., via Homebrew or standard installer).

### 1. Database Setup
Ensure PostgreSQL is running locally on port `5432` with a `postgres` user.
Create the database and enable PostGIS:
```bash
psql -U postgres -c "CREATE DATABASE flashflood;"
psql -U postgres -d flashflood -c "CREATE EXTENSION postgis;"
```

### 2. Backend Setup
Navigate to the `backend/` directory, create a virtual environment, and install dependencies:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Real Data Integration (Optional)
FlashGuard AI is equipped with real-data adapter layers for **NASA GPM IMERG** (precipitation) and **OpenStreetMap** (infrastructure exposure). By default, it operates in deterministic `SIMULATED` fallback mode.

To enable NASA IMERG, update `backend/.env` with your NASA Earthdata credentials:
```env
IMERG_ENABLED=true
NASA_EARTHDATA_USERNAME=your_username
NASA_EARTHDATA_PASSWORD=your_password
IMERG_CACHE_MINUTES=30
```
*Note: Do NOT commit this `.env` file.*

Run the deterministic database seed (this generates villages, catchments, and safe zones):
```bash
python scripts/seed_db.py
```

Run the FastAPI server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*API documentation will be available at `http://localhost:8000/docs`.*

### 4. Frontend Setup
Navigate to the `frontend/` directory, install packages, and run the development server:
```bash
cd frontend
npm install
npm run dev
```
*The UI will be accessible at `http://localhost:3000`.*

---

## 🧪 Testing

### Backend
```bash
cd backend
source venv/bin/activate
pytest tests/
```

### Frontend
```bash
cd frontend
npm run lint
npx tsc --noEmit
npm run build
```

---

## 🔍 Data Provenance

The prototype actively tags all ingested and derived variables with their exact provenance, adhering to the following classification:
*   **PUBLIC**: Data retrieved successfully from an official, open, and verified source (e.g., NASA GPM IMERG for rainfall, OpenStreetMap for building counts).
*   **DERIVED**: Values calculated dynamically from other datasets (e.g., slope derived from Copernicus DEM).
*   **SIMULATED**: Deterministic seeded fallback values used when live connections drop, APIs time out, or external credentials are missing. *Simulated values are not "real data".*
*   **UNAVAILABLE**: A data source that failed and has no fallback (gracefully handled by the Risk Engine).

---

## ⚠️ Prototype Limitations & Safety Boundary

**FlashGuard AI is a decision-support prototype using both simulated and live public data. It does not replace official emergency instructions.**
While the platform can ingest live NASA IMERG observations, the hydrological baseline is uncalibrated. Do not interpret the demo results as official or scientifically validated hazard predictions.
