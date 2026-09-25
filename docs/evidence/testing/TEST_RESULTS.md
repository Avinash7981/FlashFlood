# Test Results Evidence

## Backend Tests (Pytest)
**Command**: `cd backend && source venv/bin/activate && pytest`
- **Total Tests**: 14
- **Passed**: 14
- **Failed**: 0
- **Warnings**: 2 (FastAPI/Starlette deprecation warnings regarding `anyio` and `TestClient`)

*Tests verified `test_api.py`, `test_db.py`, and `test_risk_engine.py` logic.*

## Frontend Checks
**Lint Result**: 
Command: `npm run lint`
- **Errors**: 0
- **Warnings**: 0 (Cleaned unused vars)

**TypeScript Result**: 
Command: `npx tsc --noEmit`
- **Errors**: 0

**Production Build**: 
Command: `npm run build`
- **Result**: Compiled successfully in ~430ms.
- **Routes Generated Static**: `/`, `/_not-found`, `/alerts`, `/evacuation`, `/priorities`, `/risk-map`, `/scenarios`.
