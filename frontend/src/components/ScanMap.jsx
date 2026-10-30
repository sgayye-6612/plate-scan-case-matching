import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { RotateCcw } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { formatDateTime } from "../lib/format.js";

// Fits the map so every scan is visible.
function FitToScans({ points }) {
  const map = useMap();
  useEffect(() => {
    // The map lives in a sliding drawer: re-measure once the slide finishes.
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (points.length === 1) map.setView(points[0], 11);
      else if (points.length > 1) map.fitBounds(points, { padding: [36, 36], maxZoom: 11 });
    }, 350);
    return () => clearTimeout(timer);
  }, [map, points]);
  return null;
}

// Smoothly flies to the scan picked in the timeline.
function FlyToActive({ point }) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    map.flyTo(point, Math.max(map.getZoom(), 9), { duration: 0.9 });
  }, [map, point]);
  return null;
}

export default function ScanMap({ scans, activeIndex, onSelect }) {
  // Only scans that have coordinates can go on the map.
  const stops = useMemo(
    () =>
      scans
        .map((scan, index) => ({ scan, index }))
        .filter(({ scan }) => scan.latitude != null && scan.longitude != null),
    [scans]
  );
  const points = useMemo(() => stops.map(({ scan }) => [scan.latitude, scan.longitude]), [stops]);

  // Draw the route one scan at a time.
  const [visible, setVisible] = useState(0);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setVisible(count);
      if (count >= points.length) clearInterval(timer);
    }, 380);
    return () => clearInterval(timer);
  }, [points, replayKey]);

  const activeStop = stops.find((s) => s.index === activeIndex);
  const activePoint = useMemo(
    () => (activeStop ? [activeStop.scan.latitude, activeStop.scan.longitude] : null),
    [activeStop]
  );

  if (points.length === 0) return null;

  const shown = stops.slice(0, Math.max(visible, 1));
  const lastShown = shown.length - 1;

  return (
    <div className="scan-map">
      <MapContainer
        center={points[0]}
        zoom={5}
        scrollWheelZoom={false}
        zoomControl={false}
        className="scan-map-canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitToScans points={points} />
        <FlyToActive point={activePoint} />

        {/* Soft glow under the route + animated dashes showing direction */}
        <Polyline positions={points.slice(0, visible)} pathOptions={{ className: "trail-glow" }} />
        <Polyline positions={points.slice(0, visible)} pathOptions={{ className: "trail-line" }} />

        {shown.map(({ scan, index }, i) => {
          const isActive = index === activeIndex;
          const isLatest = i === lastShown && visible >= points.length;
          return (
            <CircleMarker
              // Leaflet can't change a marker's class after drawing it,
              // so the key changes whenever its state changes (re-draw).
              key={`${scan.id ?? index}-${isActive ? "a" : ""}${isLatest ? "l" : ""}`}
              center={[scan.latitude, scan.longitude]}
              radius={isActive ? 9 : isLatest ? 8 : 6}
              pathOptions={{
                className: `trail-stop ${isActive ? "is-active" : ""} ${isLatest ? "is-latest" : ""}`,
              }}
              eventHandlers={{ click: () => onSelect(index) }}
            >
              <Tooltip direction="top" offset={[0, -8]} className="trail-tip">
                <strong>Scan {index + 1}</strong>
                <span>{formatDateTime(scan.scanned_at)}</span>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="scan-map-bar">
        <span>
          <span className="live-dot" /> Route · {Math.min(visible, points.length)}/{points.length} stops
        </span>
        <button type="button" className="map-replay" onClick={() => {
            setVisible(0);
            setReplayKey((k) => k + 1);
          }}>
          <RotateCcw size={13} /> Replay
        </button>
      </div>
    </div>
  );
}
