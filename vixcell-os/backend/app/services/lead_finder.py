"""
Lead Finder — discovers real local businesses as sales leads.

Data source: OpenStreetMap (Nominatim geocoding + Overpass API).
Free, no API key, works with Arabic queries ("مطاعم في القاهرة").
Internet is required; callers get a clear LeadFinderError when offline.
"""
import logging
import re
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",  # mirror fallback
]
USER_AGENT = "VixcellAI-OS/1.0 (local desktop CRM; lead discovery)"


class LeadFinderError(Exception):
    """User-presentable discovery failure (offline, area not found, ...)."""


# Business-type keywords (Egyptian Arabic + English) → OSM tag filters.
# Each entry maps to one or more (key, value) selectors OR'd together.
CATEGORY_MAP: list[tuple[list[str], list[tuple[str, str]]]] = [
    (["مطاعم", "مطعم", "restaurant", "restaurants", "اكل"], [("amenity", "restaurant"), ("amenity", "fast_food")]),
    (["كافيه", "كافيهات", "قهوة", "قهاوي", "كوفي", "cafe", "cafes", "coffee"], [("amenity", "cafe")]),
    (["صيدلية", "صيدليات", "pharmacy", "pharmacies"], [("amenity", "pharmacy")]),
    (["عيادة", "عيادات", "دكاترة", "دكتور", "اطباء", "clinic", "clinics", "doctors"], [("amenity", "clinic"), ("amenity", "doctors")]),
    (["اسنان", "أسنان", "dentist"], [("amenity", "dentist")]),
    (["مستشفى", "مستشفيات", "hospital", "hospitals"], [("amenity", "hospital")]),
    (["بيطري", "بيطرية", "vet", "veterinary"], [("amenity", "veterinary")]),
    (["جيم", "جيمات", "نادي رياضي", "نوادي", "لياقة", "gym", "gyms", "fitness"], [("leisure", "fitness_centre")]),
    (["ملابس", "هدوم", "بوتيك", "clothes", "clothing", "fashion"], [("shop", "clothes"), ("shop", "boutique")]),
    (["سوبر ماركت", "سوبرماركت", "ماركت", "بقالة", "supermarket", "grocery"], [("shop", "supermarket"), ("shop", "convenience")]),
    (["مدرسة", "مدارس", "school", "schools"], [("amenity", "school")]),
    (["حضانة", "حضانات", "nursery", "kindergarten"], [("amenity", "kindergarten")]),
    (["محامي", "محامين", "محاماة", "lawyer", "lawyers"], [("office", "lawyer")]),
    (["عقارات", "عقاري", "real estate", "estate"], [("office", "estate_agent")]),
    (["ورشة", "ورش", "ميكانيكي", "car repair", "mechanic"], [("shop", "car_repair")]),
    (["معرض سيارات", "معارض سيارات", "سيارات", "عربيات", "car dealer", "cars"], [("shop", "car")]),
    (["كوافير", "صالون", "صالونات", "حلاق", "تجميل", "salon", "barber", "hairdresser", "beauty"], [("shop", "hairdresser"), ("shop", "beauty")]),
    (["مخبز", "مخابز", "فرن", "افران", "عيش", "bakery", "bakeries"], [("shop", "bakery")]),
    (["حلواني", "حلويات", "حلوانى", "sweets", "pastry", "confectionery"], [("shop", "confectionery"), ("shop", "pastry")]),
    (["فندق", "فنادق", "hotel", "hotels"], [("tourism", "hotel")]),
    (["مغسلة", "مغاسل", "دراي كلين", "laundry", "dry clean"], [("shop", "laundry"), ("shop", "dry_cleaning")]),
    (["موبايل", "موبايلات", "محمول", "mobile", "phones"], [("shop", "mobile_phone")]),
    (["كمبيوتر", "لابتوب", "computer", "laptops"], [("shop", "computer")]),
    (["مكتبة", "مكتبات", "books", "stationery"], [("shop", "books"), ("shop", "stationery")]),
    (["جزارة", "جزار", "لحوم", "butcher", "meat"], [("shop", "butcher")]),
    (["خضار", "فاكهة", "خضروات", "greengrocer"], [("shop", "greengrocer")]),
    (["اثاث", "أثاث", "موبيليا", "furniture"], [("shop", "furniture")]),
    (["مطبعة", "مطابع", "طباعة", "printing", "print shop"], [("shop", "copyshop"), ("craft", "printer")]),
]


def _normalize(text: str) -> str:
    text = (text or "").strip().lower()
    text = re.sub(r"[أإآ]", "ا", text)
    text = re.sub(r"[ًٌٍَُِّْـ]", "", text)
    return re.sub(r"\s+", " ", text)


def _match_category(what: str) -> Optional[list[tuple[str, str]]]:
    norm = _normalize(what)
    for keywords, selectors in CATEGORY_MAP:
        if any(k in norm for k in keywords):
            return selectors
    return None


def geocode_area(where: str) -> dict:
    """City/area name (Arabic or English) → {lat, lon, bbox, display_name}."""
    try:
        r = httpx.get(
            NOMINATIM_URL,
            params={"q": where, "format": "json", "limit": 1, "accept-language": "ar,en"},
            headers={"User-Agent": USER_AGENT},
            timeout=15,
        )
        r.raise_for_status()
        results = r.json()
    except httpx.HTTPError as e:
        raise LeadFinderError(f"تعذر الوصول لخدمة الخرائط — اتأكد من الإنترنت ({e.__class__.__name__})")
    if not results:
        raise LeadFinderError(f"مش لاقي مكان اسمه «{where}» — جرب اسم مدينة أو منطقة أوضح")
    hit = results[0]
    # Nominatim bbox order: [south, north, west, east]
    bb = hit["boundingbox"]
    return {
        "lat": float(hit["lat"]),
        "lon": float(hit["lon"]),
        "bbox": (float(bb[0]), float(bb[2]), float(bb[1]), float(bb[3])),  # s, w, n, e
        "display_name": hit.get("display_name", where),
    }


def _overpass_query(selectors: list[tuple[str, str]], bbox: tuple, limit: int) -> list[dict]:
    s, w, n, e = bbox
    clauses = "".join(
        f'nwr["{k}"="{v}"]["name"]({s},{w},{n},{e});' for k, v in selectors
    )
    query = f"[out:json][timeout:30];({clauses});out center tags {limit};"
    last_err: Optional[Exception] = None
    for url in OVERPASS_URLS:
        try:
            r = httpx.post(url, data={"data": query},
                           headers={"User-Agent": USER_AGENT}, timeout=45)
            r.raise_for_status()
            return r.json().get("elements", [])
        except httpx.HTTPError as e:
            last_err = e
            continue
    raise LeadFinderError(f"خدمة البحث عن الأنشطة مش مستجيبة دلوقتي — جرب تاني بعد شوية ({last_err.__class__.__name__})")


def _element_to_lead(el: dict, fallback_area: str) -> Optional[dict]:
    tags = el.get("tags") or {}
    name = tags.get("name:ar") or tags.get("name")
    if not name:
        return None
    phone = tags.get("phone") or tags.get("contact:phone") or tags.get("contact:mobile")
    website = tags.get("website") or tags.get("contact:website") or tags.get("contact:facebook")
    email = tags.get("email") or tags.get("contact:email")
    addr_parts = [tags.get("addr:street"), tags.get("addr:suburb"),
                  tags.get("addr:city") or fallback_area]
    address = "، ".join(p for p in addr_parts if p)
    lat = el.get("lat") or (el.get("center") or {}).get("lat")
    lon = el.get("lon") or (el.get("center") or {}).get("lon")
    return {
        "name": name.strip(),
        "phone": phone,
        "email": email,
        "website": website,
        "address": address or fallback_area,
        "lat": lat,
        "lon": lon,
        "osm_type": tags.get("amenity") or tags.get("shop") or tags.get("office")
                    or tags.get("leisure") or tags.get("tourism") or tags.get("craft"),
    }


def _nominatim_freetext(what: str, where: str, limit: int) -> list[dict]:
    """Fallback for business types we don't map: free-text place search."""
    try:
        r = httpx.get(
            NOMINATIM_URL,
            params={"q": f"{what} {where}", "format": "jsonv2", "limit": min(limit, 40),
                    "extratags": 1, "addressdetails": 1, "accept-language": "ar,en"},
            headers={"User-Agent": USER_AGENT},
            timeout=20,
        )
        r.raise_for_status()
        results = r.json()
    except httpx.HTTPError as e:
        raise LeadFinderError(f"تعذر البحث — اتأكد من الإنترنت ({e.__class__.__name__})")
    leads = []
    for hit in results:
        extra = hit.get("extratags") or {}
        name = hit.get("name") or (hit.get("display_name") or "").split(",")[0]
        if not name:
            continue
        addr = hit.get("address") or {}
        address = "، ".join(p for p in [addr.get("road"), addr.get("suburb"),
                                        addr.get("city") or addr.get("town") or where] if p)
        leads.append({
            "name": name.strip(),
            "phone": extra.get("phone") or extra.get("contact:phone"),
            "email": extra.get("email"),
            "website": extra.get("website") or extra.get("contact:website"),
            "address": address or where,
            "lat": float(hit["lat"]) if hit.get("lat") else None,
            "lon": float(hit["lon"]) if hit.get("lon") else None,
            "osm_type": hit.get("type"),
        })
    return leads


def find_businesses(what: str, where: str, limit: int = 30) -> dict:
    """
    Main entry: business type + area → list of lead candidates.
    Returns {"items": [...], "area": display_name, "source": "..."}.
    """
    what = (what or "").strip()
    where = (where or "").strip()
    if not what:
        raise LeadFinderError("قول نوع النشاط — مثلًا: مطاعم، صيدليات، جيمات")
    if not where:
        raise LeadFinderError("قول المكان — مثلًا: القاهرة، الإسكندرية، مدينة نصر")

    selectors = _match_category(what)
    if selectors:
        area = geocode_area(where)
        elements = _overpass_query(selectors, area["bbox"], max(limit * 3, 60))
        items, seen = [], set()
        for el in elements:
            lead = _element_to_lead(el, where)
            if not lead:
                continue
            key = lead["name"].lower()
            if key in seen:
                continue
            seen.add(key)
            items.append(lead)
        # Contactable leads first — that's what a sales user wants
        items.sort(key=lambda x: (bool(x["phone"]), bool(x["website"])), reverse=True)
        return {"items": items[:limit], "area": area["display_name"], "source": "OpenStreetMap"}

    items = _nominatim_freetext(what, where, limit)
    return {"items": items[:limit], "area": where, "source": "OpenStreetMap"}
