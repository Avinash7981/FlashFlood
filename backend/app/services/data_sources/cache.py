import time
from typing import Dict, Any, Optional

_CACHE: Dict[str, Dict[str, Any]] = {}

def get_cached(key: str) -> Optional[Any]:
    if key in _CACHE:
        entry = _CACHE[key]
        if time.time() < entry['expires_at']:
            return entry['data']
        else:
            del _CACHE[key]
    return None

def set_cached(key: str, data: Any, ttl_seconds: int = 300) -> None:
    _CACHE[key] = {
        'data': data,
        'expires_at': time.time() + ttl_seconds
    }

def clear_cache() -> None:
    _CACHE.clear()
