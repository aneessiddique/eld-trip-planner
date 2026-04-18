import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

/**
 * Fits the map to the route once when the route geometry changes — not on every
 * parent re-render (e.g. clock ticks). Calling fitBounds during render was
 * resetting zoom whenever the user panned/zoomed manually.
 */
function FitBounds({ bounds }) {
  const map = useMap();
  const fittedKeyRef = useRef(null);

  useEffect(() => {
    if (!bounds || bounds.length === 0) return;
    const key = JSON.stringify(bounds);
    if (key === fittedKeyRef.current) return;
    fittedKeyRef.current = key;

    map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30] });
  }, [map, bounds]);

  return null;
}

function RouteMap({ points }) {
  if (!points || points.length === 0) {
    return (
      <div className="h-[400px] bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
        <div className="text-center text-slate-500">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="font-medium">Route Map</p>
          <p className="text-sm">Map will appear after trip calculation</p>
        </div>
      </div>
    );
  }

  const positions = points;
  const middlePosition = positions[Math.floor(positions.length / 2)];

  return (
    <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer center={positions[0]} zoom={6} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={positions}
          color="#1f78b4"
          weight={4}
          opacity={0.8}
          dashArray="10, 10"
        />
        <Marker position={positions[0]}>
          <Popup>Current Location</Popup>
        </Marker>
        <Marker position={middlePosition}>
          <Popup>Pickup Location</Popup>
        </Marker>
        <Marker position={positions[positions.length - 1]}>
          <Popup>Dropoff Location</Popup>
        </Marker>
        <FitBounds bounds={positions} />
      </MapContainer>
    </div>
  );
}

export default RouteMap;
