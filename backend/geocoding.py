"""
Reverse geocoding via OpenStreetMap's Nominatim (same data source as the Leaflet
map tiles already used on the frontend). Results are cached in-memory since
Nominatim's usage policy caps requests to ~1/sec and results for a given area
don't change.
"""
import concurrent.futures

import httpx

_cache: dict[str, str] = {}
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)


def reverse_geocode_label(lat: float, lon: float) -> str:
    cache_key = f"{round(lat, 4)}:{round(lon, 4)}"
    if cache_key in _cache:
        return _cache[cache_key]

    label = f"{lat:.4f}, {lon:.4f}"
    try:
        # httpx's own timeout doesn't reliably bound a hung DNS lookup (e.g. no network
        # connectivity) - it can block far longer than configured. Running the request in
        # a worker thread with a hard result() timeout guarantees this never blocks a
        # dashboard/topics load for more than ~5s, network or no network.
        future = _executor.submit(_fetch_label, lat, lon)
        label = future.result(timeout=5)
    except Exception as exc:
        print(f"Reverse geocoding failed for ({lat}, {lon}): {exc}")

    _cache[cache_key] = label
    return label


def _fetch_label(lat: float, lon: float) -> str:
    resp = httpx.get(
        "https://nominatim.openstreetmap.org/reverse",
        params={"format": "jsonv2", "lat": lat, "lon": lon, "zoom": 18, "addressdetails": 1},
        headers={"User-Agent": "LocalPulseHackathon/1.0"},
        timeout=5.0,
    )
    resp.raise_for_status()
    data = resp.json()
    address = data.get("address", {})
    road = address.get("road")
    area_name = address.get("neighbourhood") or address.get("suburb") or address.get("city")
    if road and area_name:
        return f"{road}, {area_name}"
    if road:
        return road
    if data.get("display_name"):
        return data["display_name"].split(",")[0]
    return f"{lat:.4f}, {lon:.4f}"
