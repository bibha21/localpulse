"""
Approximate centre points for Espoo's major districts, used only to group
anonymised report aggregates under a human-readable neighbourhood name for
the planner dashboard's "Neighbourhood Pulse" view.

Coordinates are rough (city-scale, not survey-grade) - good enough to bucket
a report into "closest named district," not for anything precision-critical.
TODO: replace with Espoo's official suuralue (district) boundary polygons if
this becomes more than a hackathon prototype.
"""
import math

DISTRICTS = {
    "Leppävaara": (60.219, 24.813),
    "Tapiola": (60.175, 24.805),
    "Matinkylä": (60.160, 24.738),
    "Espoon keskus": (60.203, 24.655),
    "Espoonlahti": (60.147, 24.653),
    "Kauklahti": (60.180, 24.573),
}


def nearest_district(lat: float, lon: float) -> str:
    return min(
        DISTRICTS,
        key=lambda name: math.dist((lat, lon), DISTRICTS[name]),
    )
