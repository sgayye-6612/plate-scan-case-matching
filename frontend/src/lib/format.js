// Small helper functions shared by the dashboard components.
// They match the data shapes returned by the FastAPI backend:
//   Case: { id, vin, status, tenant_id, claimed_by }
//   Scan: { id, camera_id, plate, vin, latitude, longitude, scanned_at, image_url }

export const STATUS_META = {
  pending_claim: { label: "Pending claim", tone: "pending" },
  active: { label: "Active", tone: "active" },
  closed: { label: "Closed", tone: "closed" },
};

export function statusKey(item) {
  return String(item?.status || "unknown").toLowerCase();
}

export function statusLabel(item) {
  const key = statusKey(item);
  return STATUS_META[key]?.label || key.replace(/_/g, " ");
}

export function statusTone(item) {
  return STATUS_META[statusKey(item)]?.tone || "closed";
}

export function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return "Date unavailable";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(value) {
  const date = toDate(value);
  if (!date) return "--:--";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatDay(value) {
  const date = toDate(value);
  if (!date) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatCoords(lat, lng) {
  if (lat == null || lng == null) return "Location unavailable";
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
}

export function mapLink(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

// Straight-line distance between two scans, in kilometres.
export function distanceKm(a, b) {
  if ([a?.latitude, a?.longitude, b?.latitude, b?.longitude].some((v) => v == null)) {
    return null;
  }
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function toList(data, key) {
  if (Array.isArray(data)) return data;
  return data?.[key] || data?.items || data?.results || [];
}
