import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  Hand,
  Inbox,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import { statusKey, statusLabel, statusTone } from "../lib/format.js";
import { AnimatedBackground } from "./motion-primitives/animated-background";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending_claim", label: "Pending claim" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];

const COLUMNS = [
  { key: "id", label: "Case" },
  { key: "vin", label: "VIN" },
  { key: "status", label: "Status" },
  { key: "tenant_id", label: "Owner" },
];

function SortIcon({ active, direction }) {
  if (!active) return <ChevronsUpDown size={14} className="sort-icon" />;
  return direction === "asc" ? (
    <ChevronUp size={14} className="sort-icon is-on" />
  ) : (
    <ChevronDown size={14} className="sort-icon is-on" />
  );
}

export default function CasesTable({
  cases,
  counts,
  loading,
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  selectedId,
  claimingId,
  currentTenantId,
  onView,
  onClaim,
}) {
  const [sort, setSort] = useState({ key: "id", direction: "asc" });

  const visibleCases = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = cases.filter((item) => {
      const matchesStatus = statusFilter === "all" || statusKey(item) === statusFilter;
      const text = [
        item.id,
        `case ${item.id}`,
        item.vin,
        item.status,
        statusLabel(item),
        item.tenant_id != null ? `tenant ${item.tenant_id}` : "unassigned",
      ]
        .filter((v) => v != null)
        .join(" ")
        .toLowerCase();
      return matchesStatus && text.includes(query);
    });

    const dir = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const x = a[sort.key] ?? "";
      const y = b[sort.key] ?? "";
      if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
      return String(x).localeCompare(String(y)) * dir;
    });
  }, [cases, search, statusFilter, sort]);

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Cases</h2>
          <p>Search, filter and inspect vehicle matches for your agency.</p>
        </div>
        <motion.span
          key={visibleCases.length}
          className="result-count"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {visibleCases.length} {visibleCases.length === 1 ? "result" : "results"}
        </motion.span>
      </div>

      <div className="toolbar">
        <label className="search-box">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search by case ID, VIN, status or tenant…"
            aria-label="Search cases"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                type="button"
                className="search-clear"
                onClick={() => onSearch("")}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                aria-label="Clear search"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </label>

        {/* Motion Primitives: AnimatedBackground slides the pill between tabs */}
        <div className="segmented" role="tablist" aria-label="Filter by status">
          <AnimatedBackground
            defaultValue={statusFilter}
            onValueChange={(id) => id && onStatusFilter(id)}
            className="segment-pill"
            transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
          >
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                data-id={filter.value}
                type="button"
                role="tab"
                aria-selected={statusFilter === filter.value}
                className={`segment ${statusFilter === filter.value ? "is-on" : ""}`}
              >
                <span className="segment-text">
                  {filter.label}
                  <span className="segment-count">{counts[filter.value] ?? 0}</span>
                </span>
              </button>
            ))}
          </AnimatedBackground>
        </div>
      </div>

      <div className="table-wrap">
        <table className="cases-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key}>
                  <button type="button" className="th-button" onClick={() => toggleSort(col.key)}>
                    {col.label}
                    <SortIcon active={sort.key === col.key} direction={sort.direction} />
                  </button>
                </th>
              ))}
              <th className="th-actions">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && cases.length === 0 ? (
              [0, 1, 2, 3].map((i) => (
                <tr key={`skeleton-${i}`} className="skeleton-row">
                  {[0, 1, 2, 3, 4].map((j) => (
                    <td key={j}>
                      <span className="skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <AnimatePresence initial={true}>
                {visibleCases.map((item, index) => {
                  const isPending = statusKey(item) === "pending_claim";
                  const isMine = item.tenant_id != null && item.tenant_id === currentTenantId;
                  return (
                    <motion.tr
                      key={item.id}
                      layout="position"
                      className={`case-row ${selectedId === item.id ? "is-selected" : ""}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
                      onClick={() => onView(item)}
                    >
                      <td data-label="Case">
                        <span className="case-id">
                          <span className="case-hash">#</span>
                          {item.id}
                        </span>
                      </td>
                      <td data-label="VIN">
                        <span className="vin">{item.vin || "—"}</span>
                      </td>
                      <td data-label="Status">
                        <span className={`badge tone-${statusTone(item)}`}>
                          <span className="badge-dot" />
                          {statusLabel(item)}
                        </span>
                      </td>
                      <td data-label="Owner">
                        {item.tenant_id == null ? (
                          <span className="muted">Unassigned</span>
                        ) : (
                          <span className={isMine ? "owner-mine" : ""}>
                            Tenant {item.tenant_id}
                            {isMine && <span className="you-chip">You</span>}
                          </span>
                        )}
                      </td>
                      <td data-label="Actions" className="td-actions">
                        <div className="row-actions" onClick={(event) => event.stopPropagation()}>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onView(item)}>
                            <Eye size={14} />
                            Scans
                          </button>
                          {isPending && (
                            <motion.button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => onClaim(item.id)}
                              disabled={claimingId === item.id}
                              whileTap={{ scale: 0.95 }}
                            >
                              {claimingId === item.id ? (
                                <LoaderCircle size={14} className="spin" />
                              ) : (
                                <Hand size={14} />
                              )}
                              {claimingId === item.id ? "Claiming" : "Claim"}
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>

        <AnimatePresence>
          {!loading && visibleCases.length === 0 && (
            <motion.div
              className="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Inbox size={28} />
              <strong>No cases found</strong>
              <span>Try a different search or status filter.</span>
              {(search || statusFilter !== "all") && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    onSearch("");
                    onStatusFilter("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
