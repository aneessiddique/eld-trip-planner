import requests
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, time
from typing import Any, Dict, List
import time as time_module


OFF_DUTY = "OFF_DUTY"
SLEEPER = "SLEEPER"
DRIVING = "DRIVING"
ON_DUTY = "ON_DUTY"
METER_TO_MILE = 0.000621371
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving"
USER_AGENT = "InterstateTDG/1.0"


def _clean_location_display_name(
    display_name: str,
    default_code: str = "",
) -> str:
    """
    Extract clean English-only text from a geocoded display name.
    Strips non-ASCII characters, limits to first 3 comma-separated parts.
    """
    if not display_name:
        return ""

    parts = [p.strip() for p in display_name.split(",") if p.strip()]
    english_parts = []

    for part in parts:
        # Keep only ASCII characters
        ascii_part = "".join(ch for ch in part if ord(ch) < 128).strip()
        if ascii_part:
            english_parts.append(ascii_part)
        if len(english_parts) >= 3:
            break

    if not english_parts:
        # Last resort: strip all non-ASCII from entire string
        fallback = "".join(
            ch for ch in display_name if ord(ch) < 128
        ).strip()
        english_parts = [fallback] if fallback else [display_name]

    result = ", ".join(english_parts)

    # Append country code if provided and not already present
    if default_code and default_code.upper() not in result.upper():
        result = f"{result}, {default_code}"

    return result


@dataclass
class HosLogEntry:
    status: str
    start_time: datetime
    end_time: datetime
    duration_hours: float
    description: str
    miles: float = 0.0
    remarks: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _round_duration_hours(delta: timedelta) -> float:
    return round(delta.total_seconds() / 3600.0, 2)


def _build_datetime(date_obj: datetime, tzinfo):
    return datetime(date_obj.year, date_obj.month, date_obj.day, tzinfo=tzinfo)


def _make_request_with_retry(url, params=None, headers=None, timeout=15, max_retries=3):
    """
    Make HTTP request with retry logic.
    Retries up to max_retries times with exponential backoff.
    """
    last_error = None
    for attempt in range(max_retries):
        try:
            response = requests.get(
                url,
                params=params,
                headers=headers or {"User-Agent": USER_AGENT},
                timeout=timeout,
            )
            response.raise_for_status()
            return response
        except requests.exceptions.Timeout:
            last_error = f"Request timed out after {timeout}s"
            time_module.sleep(2**attempt)
        except requests.exceptions.ConnectionError:
            last_error = "Connection error - service may be unavailable"
            time_module.sleep(2**attempt)
        except requests.exceptions.HTTPError as e:
            last_error = f"HTTP error: {e}"
            status = e.response.status_code if e.response is not None else None
            if status is not None and status < 500:
                raise
            time_module.sleep(2**attempt)
    raise ValueError(f"API request failed after {max_retries} attempts: {last_error}")


def _geocode_address(address: str) -> Dict[str, Any]:
    """
    Geocode any address worldwide using Nominatim.
    No country pre-detection needed.
    Country code is extracted directly from Nominatim response.
    Works for any city, any country, any address format.
    """
    if not address or not address.strip():
        raise ValueError("Address cannot be empty")

    # Step 1: Try geocoding with the address as-is
    params = {
        "q": address.strip(),
        "format": "json",
        "limit": 1,
        "addressdetails": 1,  # Ask Nominatim to return address breakdown
    }

    response = _make_request_with_retry(
        NOMINATIM_URL,
        params=params,
        headers={"User-Agent": USER_AGENT},
        timeout=15,
    )
    results = response.json()

    # Step 2: If no results, try with broader search
    if not results:
        params_broad = {
            "q": address.strip(),
            "format": "json",
            "limit": 3,
            "addressdetails": 1,
        }
        response = _make_request_with_retry(
            NOMINATIM_URL,
            params=params_broad,
            headers={"User-Agent": USER_AGENT},
            timeout=15,
        )
        results = response.json()

    if not results:
        raise ValueError(
            f"Location not found: '{address}'. "
            f"Please try a more specific address like "
            f"'Chicago, IL' or 'London, UK'."
        )

    location = results[0]

    # Step 3: Extract country code directly from Nominatim response
    # Nominatim returns address breakdown when addressdetails=1
    address_details = location.get("address", {})

    # country_code comes directly from Nominatim - no guessing needed
    country_code = address_details.get("country_code", "").upper()
    country_name = address_details.get("country", "")

    # Build a clean display name from address components
    city = (
        address_details.get("city")
        or address_details.get("town")
        or address_details.get("village")
        or address_details.get("municipality")
        or address_details.get("county")
        or ""
    )
    state = (
        address_details.get("state")
        or address_details.get("province")
        or address_details.get("region")
        or ""
    )

    # Build clean English display name
    display_parts = []
    if city:
        display_parts.append(city)
    if state:
        display_parts.append(state)
    if country_code:
        display_parts.append(country_code)

    # Use built display name if we have parts, else fall back to raw
    clean_display = (
        ", ".join(display_parts)
        if display_parts
        else _clean_location_display_name(
            location.get("display_name", address)
        )
    )

    return {
        "display_name": clean_display,
        "raw_display_name": location.get("display_name", address),
        "lat": float(location["lat"]),
        "lon": float(location["lon"]),
        "country_code": country_code,
        "country_name": country_name,
        "city": city,
        "state": state,
    }


def _fetch_route(origin: Dict[str, Any], pickup: Dict[str, Any], dropoff: Dict[str, Any]) -> Dict[str, Any]:
    coords = ";".join(
        [
            f"{origin['lon']},{origin['lat']}",
            f"{pickup['lon']},{pickup['lat']}",
            f"{dropoff['lon']},{dropoff['lat']}",
        ]
    )
    response = _make_request_with_retry(
        f"{OSRM_ROUTE_URL}/{coords}",
        params={
            "overview": "full",
            "geometries": "geojson",
            "steps": "true",
            "annotations": "duration,distance",
        },
        timeout=30,
    )
    payload = response.json()
    if payload.get("code") != "Ok" or not payload.get("routes"):
        raise ValueError("Unable to build route for the requested trip")

    route = payload["routes"][0]
    geometry = [[point[1], point[0]] for point in route["geometry"]["coordinates"]]
    instructions: List[Dict[str, Any]] = []
    for leg in route["legs"]:
        for step in leg["steps"]:
            maneuver = step.get("maneuver", {})
            raw_name = (step.get("name") or maneuver.get("instruction") or "").strip()
            instruction_text = raw_name if raw_name else "Unnamed Road"
            road_name = step.get("name") or "Unnamed Road"
            instructions.append(
                {
                    "instruction": instruction_text,
                    "distance_miles": round(step.get("distance", 0.0) * METER_TO_MILE, 2),
                    "duration_hours": round(step.get("duration", 0.0) / 3600.0, 3),
                    "road": road_name,
                }
            )

    return {
        "distance_miles": round(route["distance"] * METER_TO_MILE, 2),
        "duration_hours": round(route["duration"] / 3600.0, 2),
        "geometry": geometry,
        "legs": route["legs"],
        "instructions": instructions,
    }


def _split_entry_by_midnight(entry: HosLogEntry) -> List[HosLogEntry]:
    parts: List[HosLogEntry] = []
    start = entry.start_time
    end = entry.end_time
    tzinfo = start.tzinfo

    while start.date() != end.date():
        midnight = datetime.combine(start.date() + timedelta(days=1), time.min).replace(tzinfo=tzinfo)
        parts.append(
            HosLogEntry(
                status=entry.status,
                start_time=start,
                end_time=midnight,
                duration_hours=_round_duration_hours(midnight - start),
                description=entry.description,
                miles=entry.miles,
                remarks=entry.remarks,
            )
        )
        start = midnight

    parts.append(
        HosLogEntry(
            status=entry.status,
            start_time=start,
            end_time=end,
            duration_hours=_round_duration_hours(end - start),
            description=entry.description,
            miles=entry.miles,
            remarks=entry.remarks,
        )
    )
    return parts


def _build_daily_sheets(entries: List[HosLogEntry]) -> List[Dict[str, Any]]:
    if not entries:
        return []

    expanded: List[HosLogEntry] = []
    for entry in entries:
        expanded.extend(_split_entry_by_midnight(entry))
    expanded.sort(key=lambda item: item.start_time)

    current_tz = expanded[0].start_time.tzinfo
    sheets: List[Dict[str, Any]] = []
    day_groups: Dict[str, List[HosLogEntry]] = {}

    for entry in expanded:
        day_key = entry.start_time.date().isoformat()
        day_groups.setdefault(day_key, []).append(entry)

    for day_key in sorted(day_groups):
        entries_for_day = day_groups[day_key]
        day_start = datetime.fromisoformat(day_key).replace(tzinfo=current_tz)
        day_end = day_start + timedelta(days=1)
        filled: List[HosLogEntry] = []
        cursor = day_start

        for entry in entries_for_day:
            if entry.start_time > cursor:
                filled.append(
                    HosLogEntry(
                        status=OFF_DUTY,
                        start_time=cursor,
                        end_time=entry.start_time,
                        duration_hours=_round_duration_hours(entry.start_time - cursor),
                        description="Off duty",
                        miles=0.0,
                        remarks="",
                    )
                )
            filled.append(entry)
            cursor = entry.end_time

        if cursor < day_end:
            filled.append(
                HosLogEntry(
                    status=OFF_DUTY,
                    start_time=cursor,
                    end_time=day_end,
                    duration_hours=_round_duration_hours(day_end - cursor),
                    description="Off duty",
                    miles=0.0,
                    remarks="",
                )
            )

        totals = {
            OFF_DUTY: round(sum(item.duration_hours for item in filled if item.status == OFF_DUTY), 2),
            SLEEPER: round(sum(item.duration_hours for item in filled if item.status == SLEEPER), 2),
            DRIVING: round(sum(item.duration_hours for item in filled if item.status == DRIVING), 2),
            ON_DUTY: round(sum(item.duration_hours for item in filled if item.status == ON_DUTY), 2),
        }
        remarks: List[str] = []
        for item in filled:
            if item.remarks:
                remarks.append(f"{item.description} - {item.remarks}")
        sheets.append(
            {
                "date": day_key,
                "entries": [entry.to_dict() for entry in filled],
                "totals": totals,
                "remarks": remarks,
            }
        )

    return sheets


def _add_event(entries: List[HosLogEntry], status: str, start: datetime, end: datetime, description: str, miles: float = 0.0, remarks: str = ""):
    if end <= start:
        return
    entry = HosLogEntry(
        status=status,
        start_time=start,
        end_time=end,
        duration_hours=_round_duration_hours(end - start),
        description=description,
        miles=round(miles, 2),
        remarks=remarks,
    )
    entries.append(entry)


def _schedule_break(entries: List[HosLogEntry], state: Dict[str, Any], duration_hours: float, description: str, reset_shift: bool = False, reset_cycle: bool = False):
    start = state["current_time"]
    end = start + timedelta(hours=duration_hours)
    _add_event(entries, OFF_DUTY, start, end, description, miles=0.0)
    state["current_time"] = end
    state["driving_since_break"] = 0.0
    state["driving_since_rest"] = 0.0 if reset_shift else state["driving_since_rest"]
    if reset_shift:
        state["shift_start"] = end
    if reset_cycle:
        state["cycle_hours"] = 0.0
    state["fuel_since_last"] = 0.0


def _schedule_on_duty(entries: List[HosLogEntry], state: Dict[str, Any], duration_hours: float, description: str, remarks: str = ""):
    start = state["current_time"]
    end = start + timedelta(hours=duration_hours)
    _add_event(entries, ON_DUTY, start, end, description, miles=0.0, remarks=remarks)
    state["current_time"] = end
    state["cycle_hours"] += duration_hours


def _schedule_driving_segment(entries: List[HosLogEntry], state: Dict[str, Any], leg_label: str, remaining_hours: float, remaining_miles: float, fuel_interval_miles: int):
    if remaining_hours > 0 and remaining_miles > 0:
        speed = remaining_miles / remaining_hours
        speed = max(25.0, min(80.0, speed))
    else:
        speed = 55.0
    destination_label = leg_label

    while remaining_hours > 0.01:
        shift_elapsed = (state["current_time"] - state["shift_start"]).total_seconds() / 3600.0
        allowed_by_11 = 11.0 - state["driving_since_rest"]
        allowed_by_8 = 8.0 - state["driving_since_break"]
        allowed_by_14 = 14.0 - shift_elapsed

        if state["cycle_hours"] >= 70.0:
            _schedule_break(entries, state, 34.0, "34-hour restart", reset_shift=True, reset_cycle=True)
            continue

        if allowed_by_8 <= 0.0:
            _schedule_break(entries, state, 0.5, "Required 30-minute break")
            continue

        if allowed_by_11 <= 0.0 or allowed_by_14 <= 0.0:
            _schedule_break(entries, state, 10.0, "10-hour rest to reset driving window", reset_shift=True)
            continue

        segment_hours = min(remaining_hours, allowed_by_11, allowed_by_8, allowed_by_14)
        hours_to_fuel = max(0.0, (fuel_interval_miles - state["fuel_since_last"]) / speed)
        if hours_to_fuel <= 0.0:
            _schedule_on_duty(entries, state, 0.5, "Fuel stop", remarks="Fuel stop")
            state["fuel_since_last"] = 0.0
            continue
        if hours_to_fuel < segment_hours:
            segment_hours = hours_to_fuel

        if segment_hours <= 0.0:
            _schedule_break(entries, state, 0.5, "Required 30-minute break")
            continue

        segment_miles = min(remaining_miles, round(speed * segment_hours, 2))
        segment_end = state["current_time"] + timedelta(hours=segment_hours)
        _add_event(
            entries,
            DRIVING,
            state["current_time"],
            segment_end,
            f"Driving to {destination_label}",
            miles=segment_miles,
            remarks="",
        )
        state["current_time"] = segment_end
        state["driving_since_break"] += segment_hours
        state["driving_since_rest"] += segment_hours
        state["fuel_since_last"] += segment_miles
        state["cycle_hours"] += segment_hours
        remaining_hours -= segment_hours
        remaining_miles -= segment_miles

        if state["fuel_since_last"] >= fuel_interval_miles - 0.1 and remaining_hours > 0.0:
            _schedule_on_duty(entries, state, 0.5, "Fuel stop", remarks="Fuel stop")
            state["fuel_since_last"] = 0.0

    return remaining_hours, remaining_miles


def calculate_trip_plan(
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    start_time: datetime,
    current_cycle_used_hours: float = 0.0,
    pre_trip_minutes: int = 30,
    pickup_stop_minutes: int = 60,
    dropoff_stop_minutes: int = 60,
    fuel_interval_miles: int = 1000,
) -> Dict[str, Any]:
    if not current_location or not current_location.strip():
        raise ValueError(
            "Current location is required. "
            "Example: 'Chicago, IL' or 'London, UK'"
        )
    if not pickup_location or not pickup_location.strip():
        raise ValueError(
            "Pickup location is required. "
            "Example: 'Indianapolis, IN' or 'Manchester, UK'"
        )
    if not dropoff_location or not dropoff_location.strip():
        raise ValueError(
            "Dropoff location is required. "
            "Example: 'Louisville, KY' or 'Birmingham, UK'"
        )
    if current_cycle_used_hours < 0:
        raise ValueError(
            "Current cycle used hours cannot be negative."
        )
    if current_cycle_used_hours >= 70:
        raise ValueError(
            "Driver has used 70 or more hours in the cycle. "
            "A 34-hour restart is required before this trip."
        )

    origin = _geocode_address(current_location)
    time_module.sleep(1.1)
    pickup = _geocode_address(pickup_location)
    time_module.sleep(1.1)
    dropoff = _geocode_address(dropoff_location)
    route = _fetch_route(origin, pickup, dropoff)

    # Country codes now come dynamically from Nominatim response
    # No hardcoded defaults needed
    origin_code = origin.get("country_code", "")
    pickup_code = pickup.get("country_code", "")
    dropoff_code = dropoff.get("country_code", "")

    entries: List[HosLogEntry] = []
    current_time = start_time
    cycle_hours = float(current_cycle_used_hours)
    state = {
        "current_time": current_time,
        "shift_start": current_time,
        "driving_since_break": 0.0,
        "driving_since_rest": 0.0,
        "fuel_since_last": 0.0,
        "cycle_hours": cycle_hours,
    }

    # display_name is already clean because _geocode_address
    # builds it from structured Nominatim address components
    pickup_remarks = pickup.get("display_name", pickup_location)
    dropoff_remarks = dropoff.get("display_name", dropoff_location)
    origin_remarks = origin.get("display_name", current_location)

    _schedule_on_duty(entries, state, pre_trip_minutes / 60.0, "Pre-trip inspection", remarks=origin_remarks)

    legs = route["legs"]
    leg_labels = ["pickup", "dropoff"]
    for index, leg in enumerate(legs):
        leg_distance = round(leg.get("distance", 0.0) * METER_TO_MILE, 2)
        leg_duration = round(leg.get("duration", 0.0) / 3600.0, 3)
        _, _ = _schedule_driving_segment(
            entries,
            state,
            leg_labels[index],
            leg_duration,
            leg_distance,
            fuel_interval_miles,
        )

        if index == 0:
            _schedule_on_duty(
                entries,
                state,
                pickup_stop_minutes / 60.0,
                "Pickup stop",
                remarks=pickup_remarks,
            )
        else:
            _schedule_on_duty(
                entries,
                state,
                dropoff_stop_minutes / 60.0,
                "Dropoff stop",
                remarks=dropoff_remarks,
            )

    daily_sheets = _build_daily_sheets(entries)

    return {
        "route": {
            "distance_miles": route["distance_miles"],
            "duration_hours": route["duration_hours"],
            "geometry": route["geometry"],
            "origin": origin["display_name"],
            "pickup": pickup["display_name"],
            "dropoff": dropoff["display_name"],
            "origin_country": origin.get("country_name", ""),
            "pickup_country": pickup.get("country_name", ""),
            "dropoff_country": dropoff.get("country_name", ""),
        },
        "instructions": route["instructions"],
        "cycle_used_hours": round(cycle_hours, 2),
        "daily_sheets": daily_sheets,
        "log_entries": [entry.to_dict() for entry in entries],
    }
