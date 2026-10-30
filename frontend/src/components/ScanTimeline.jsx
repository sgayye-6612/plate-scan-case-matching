import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Camera,
  Clock,
  ExternalLink,
  Hand,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Route,
  ScanLine,
  X,
} from "lucide-react";
import {
  distanceKm,
  formatCoords,
  formatDateTime,
  formatDay,
  formatTime,
  mapLink,
  statusKey,
  statusLabel,
  statusTone,
  toDate,
} from "../lib/format.js";
import { TextShimmer } from "./motion-primitives/text-shimmer";

// The map library is large, so it only loads when a timeline is opened.
const ScanMap = lazy(() => import("./ScanMap.jsx"));

export default function ScanTimeline({ caseItem, scans, loading, claimingId, onClaim, onClose }) {
  // Which scan is highlighted on the map + timeline (remembered per case).
  const [active, setActive] = useState({ caseId: null, index: null });
  const activeIndex = active.caseId === caseItem?.id ? active.index : null;
  const cardRefs = useRef({});

  function selectScan(index, scroll = false) {
    setActive({ caseId: caseItem?.id, index });
    if (scroll) {
      cardRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // Close the drawer with the Escape key.
  useEffect(() => {
    if (!caseItem) return;
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [caseItem, onClose]);

  const ordered = useMemo(
    () =>
      [...scans].sort(
        (a, b) => (toDate(a.scanned_at)?.getTime() ?? 0) - (toDate(b.scanned_at)?.getTime() ?? 0)
      ),
    [scans]
  );

  const summary = useMemo(() => {
    let km = 0;
    for (let i = 1; i < ordered.length; i += 1) km += distanceKm(ordered[i - 1], ordered[i]) || 0;
    const plates = [...new Set(ordered.map((s) => s.plate).filter(Boolean))];
    const places = new Set(ordered.map((s) => formatCoords(s.latitude, s.longitude)));
    return {
      km: Math.round(km),
      plates,
      places: places.size,
      first: ordered[0]?.scanned_at,
      last: ordered[ordered.length - 1]?.scanned_at,
    };
  }, [ordered]);

  // Group scans by calendar day for the timeline headings.
  const groups = useMemo(() => {
    const map = new Map();
    ordered.forEach((scan, index) => {
      const day = formatDay(scan.scanned_at);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push({ scan, index });
    });
    return [...map.entries()];
  }, [ordered]);

  return (
    <AnimatePresence>
      {caseItem && (
        <>
          <motion.div
            className="drawer-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Scan history for case ${caseItem.id}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
          >
            <header className="drawer-head">
              <div>
                <p className="eyebrow">Case #{caseItem.id}</p>
                <h2 className="vin vin-lg">{caseItem.vin}</h2>
                <div className="drawer-meta">
                  <span className={`badge tone-${statusTone(caseItem)}`}>
                    <span className="badge-dot" />
                    {statusLabel(caseItem)}
                  </span>
                  {summary.plates.map((plate) => (
                    <span className="plate" key={plate}>
                      {plate}
                    </span>
                  ))}
                </div>
              </div>
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Close scan history">
                <X size={18} />
              </button>
            </header>

            {statusKey(caseItem) === "pending_claim" && (
              <div className="claim-banner">
                <span>This case is unclaimed. Claim it to assign it to your agency.</span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onClaim(caseItem.id)}
                  disabled={claimingId === caseItem.id}
                >
                  {claimingId === caseItem.id ? <LoaderCircle size={14} className="spin" /> : <Hand size={14} />}
                  {claimingId === caseItem.id ? "Claiming" : "Claim case"}
                </button>
              </div>
            )}

            <div className="drawer-stats">
              {[
                { icon: ScanLine, label: "Scans", value: ordered.length },
                { icon: MapPin, label: "Locations", value: summary.places },
                { icon: Route, label: "Distance", value: `${summary.km.toLocaleString()} km` },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="mini-stat"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                >
                  <stat.icon size={15} />
                  <span>{stat.label}</span>
                  <strong>{loading ? "…" : stat.value}</strong>
                </motion.div>
              ))}
            </div>

            <div className="drawer-body">
              <h3 className="timeline-title">Scan history &amp; location trail</h3>

              {loading ? (
                <div className="timeline-loading">
                  <TextShimmer as="p" className="shimmer" duration={1.4}>
                    Loading scan history…
                  </TextShimmer>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="skeleton skeleton-card" />
                  ))}
                </div>
              ) : ordered.length === 0 ? (
                <div className="empty">
                  <ScanLine size={28} />
                  <strong>No scans yet</strong>
                  <span>No camera has reported this VIN so far.</span>
                </div>
              ) : (
                <>
                  <Suspense fallback={<span className="skeleton skeleton-map" />}>
                    <ScanMap
                      key={caseItem.id}
                      scans={ordered}
                      activeIndex={activeIndex}
                      onSelect={(index) => selectScan(index, true)}
                    />
                  </Suspense>
                  <p className="timeline-range">
                    <Clock size={13} /> {formatDateTime(summary.first)} → {formatDateTime(summary.last)}
                  </p>
                  <div className="timeline">
                    <motion.span
                      className="timeline-line"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                    {groups.map(([day, items]) => (
                      <div key={day} className="timeline-group">
                        <div className="timeline-day">{day}</div>
                        {items.map(({ scan, index }) => {
                          const prev = ordered[index - 1];
                          const km = prev ? distanceKm(prev, scan) : null;
                          const isLatest = index === ordered.length - 1;
                          const link = mapLink(scan.latitude, scan.longitude);
                          return (
                            <motion.article
                              key={scan.id ?? `${scan.scanned_at}-${index}`}
                              ref={(el) => {
                                cardRefs.current[index] = el;
                              }}
                              className={`scan-card ${isLatest ? "is-latest" : ""} ${
                                activeIndex === index ? "is-active" : ""
                              }`}
                              onClick={() => selectScan(index)}
                              title="Show on map"
                              initial={{ opacity: 0, x: 18 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.35, delay: 0.1 + index * 0.06 }}
                              whileHover={{ x: 4 }}
                            >
                              <span className="scan-dot" aria-hidden="true" />
                              <div className="scan-row">
                                <span className="scan-time">{formatTime(scan.scanned_at)}</span>
                                {isLatest && <span className="latest-chip">Latest sighting</span>}
                                {scan.plate && <span className="plate plate-sm">{scan.plate}</span>}
                              </div>
                              <div className="scan-details">
                                <span>
                                  <MapPin size={13} /> {formatCoords(scan.latitude, scan.longitude)}
                                </span>
                                <span>
                                  <Camera size={13} /> Camera {scan.camera_id ?? "—"}
                                </span>
                                {km != null && km >= 1 && (
                                  <span className="scan-move">
                                    <Route size={13} /> +{Math.round(km).toLocaleString()} km from previous
                                  </span>
                                )}
                              </div>
                              <div className="scan-links">
                                {link && (
                                  <a href={link} target="_blank" rel="noreferrer">
                                    <ExternalLink size={12} /> Open map
                                  </a>
                                )}
                                {scan.image_url && (
                                  <a href={scan.image_url} target="_blank" rel="noreferrer">
                                    <ImageIcon size={12} /> View image
                                  </a>
                                )}
                              </div>
                            </motion.article>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
