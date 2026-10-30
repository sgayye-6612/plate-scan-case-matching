import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  Archive,
  ArrowRight,
  CircleCheck,
  CircleDot,
  Layers,
  LoaderCircle,
  Lock,
  LogOut,
  RefreshCw,
  ScanLine,
  TriangleAlert,
  User,
  X,
} from "lucide-react";
import { TextEffect } from "./components/motion-primitives/text-effect";
import { AnimatedGroup } from "./components/motion-primitives/animated-group";
import { BorderTrail } from "./components/motion-primitives/border-trail";
import { Magnetic } from "./components/motion-primitives/magnetic";
import StatCard from "./components/StatCard.jsx";
import CasesTable from "./components/CasesTable.jsx";
import ScanTimeline from "./components/ScanTimeline.jsx";
import { statusKey, toList } from "./lib/format.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SESSION_KEY = "platescan-session";

// Keeps you signed in after a page refresh (cleared on sign out / tab close).
function loadSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    return saved?.username ? saved : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable: ignore */
  }
}

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(loadSession);
  const currentUser = session?.username || "";

  const [cases, setCases] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scansLoading, setScansLoading] = useState(false);
  const [claimingId, setClaimingId] = useState(null);
  const [toast, setToast] = useState(null); // { type: "success" | "error", text }

  const notify = useCallback((type, text) => {
    setToast({ type, text, id: Date.now() });
  }, []);

  // Hide toast automatically after 3.5 seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const apiRequest = useCallback(
    async (path, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...(currentUser ? { Authorization: `Bearer ${currentUser}` } : {}),
        ...options.headers,
      };

      const response = await fetch(`${API_URL}${path}`, { ...options, headers });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || data.message || `Request failed (${response.status})`);
      }
      return data;
    },
    [currentUser]
  );

  const fetchCases = useCallback(async () => {
    const data = await apiRequest("/api/v1/cases");
    return toList(data, "cases");
  }, [apiRequest]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Login failed. Check your credentials.");
      }

      const next = {
        username: data.username || username,
        userId: data.user_id,
        tenantId: data.tenant_id,
      };
      saveSession(next);
      setSession(next);
      notify("success", `Welcome, ${next.username}`);
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Cannot reach the server. Is FastAPI running on port 8000?"
          : err.message;
      notify("error", message);
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    saveSession(null);
    setSession(null);
    setCases([]);
    setSelectedCase(null);
    setScans([]);
    setPassword("");
    setSearch("");
    setStatusFilter("all");
    setToast(null);
  }

  // Load cases after sign in.
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const list = await fetchCases();
        if (!cancelled) setCases(list);
      } catch (err) {
        if (!cancelled) notify("error", err.message || "Could not load cases.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [currentUser, fetchCases, notify]);

  async function refreshCases() {
    setLoading(true);
    try {
      setCases(await fetchCases());
      notify("success", "Cases refreshed");
    } catch (err) {
      notify("error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openCase(caseItem) {
    setSelectedCase(caseItem);
    setScans([]);
    setScansLoading(true);

    try {
      const data = await apiRequest(`/api/v1/cases/${caseItem.id}/scans`);
      setScans(toList(data, "scans"));
    } catch (err) {
      notify("error", `Could not load scan history: ${err.message}`);
    } finally {
      setScansLoading(false);
    }
  }

  const closeCase = useCallback(() => {
    setSelectedCase(null);
    setScans([]);
  }, []);

  async function claimCase(caseId) {
    setClaimingId(caseId);
    try {
      await apiRequest(`/api/v1/cases/${caseId}/claim`, { method: "POST" });
      const list = await fetchCases();
      setCases(list);
      if (selectedCase?.id === caseId) {
        const updated = list.find((item) => item.id === caseId);
        if (updated) setSelectedCase(updated);
      }
      notify("success", `Case #${caseId} claimed for your agency`);
    } catch (err) {
      notify("error", err.message || "Could not claim this case.");
    } finally {
      setClaimingId(null);
    }
  }

  const counts = useMemo(() => {
    const result = { all: cases.length, pending_claim: 0, active: 0, closed: 0 };
    cases.forEach((item) => {
      const key = statusKey(item);
      if (key in result) result[key] += 1;
    });
    return result;
  }, [cases]);

  const toastView = (
    <div className="toast-zone" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {toast.type === "error" ? <TriangleAlert size={16} /> : <CircleCheck size={16} />}
            <span>{toast.text}</span>
            <button type="button" onClick={() => setToast(null)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ---------------- LOGIN SCREEN ----------------
  if (!currentUser) {
    return (
      <MotionConfig reducedMotion="user">
        {toastView}
        <div className="login-page">
          <div className="login-grid" aria-hidden="true" />
          <motion.div
            className="login-orb"
            aria-hidden="true"
            animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="login-card"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Motion Primitives: a light that runs around the card border */}
            <BorderTrail className="border-trail" size={110} transition={{ repeat: Infinity, duration: 7, ease: "linear" }} />

            <div className="brand">
              <span className="brand-icon">
                <ScanLine size={20} />
                <motion.span
                  className="brand-scan"
                  animate={{ y: ["-60%", "60%", "-60%"] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </span>
              <div>
                <strong>PlateScan</strong>
                <span>Case Matching Platform</span>
              </div>
            </div>

            <div className="login-heading">
              <TextEffect preset="fade-in-blur" as="h1">
                Welcome back
              </TextEffect>
              <p>Sign in to access your agency's case dashboard.</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              {/* Motion Primitives: fields appear one after another */}
              <AnimatedGroup className="login-fields" preset="blur-slide">
              <label className="field">
                <span>Username</span>
                <span className="field-input">
                  <User size={16} />
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    required
                  />
                </span>
              </label>

              <label className="field">
                <span>Password</span>
                <span className="field-input">
                  <Lock size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                </span>
              </label>

              {/* Motion Primitives: button gently follows the mouse */}
              <Magnetic intensity={0.12} range={160}>
                <motion.button
                  className="btn btn-primary btn-lg"
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? <LoaderCircle size={16} className="spin" /> : null}
                  {loading ? "Signing in…" : "Sign in"}
                  {!loading && <ArrowRight size={16} />}
                </motion.button>
              </Magnetic>
              </AnimatedGroup>
            </form>

            <p className="login-footer">Demo users: agent_a / agent_b · password123</p>
          </motion.div>
        </div>
      </MotionConfig>
    );
  }

  // ---------------- DASHBOARD ----------------
  const cards = [
    { key: "all", label: "Total cases", value: counts.all, icon: Layers, tone: "total" },
    { key: "pending_claim", label: "Pending claim", value: counts.pending_claim, icon: CircleDot, tone: "pending" },
    { key: "active", label: "Active", value: counts.active, icon: CircleCheck, tone: "active" },
    { key: "closed", label: "Closed", value: counts.closed, icon: Archive, tone: "closed" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      {toastView}
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <span className="brand-icon">
              <ScanLine size={18} />
            </span>
            <div>
              <strong>PlateScan</strong>
              <span>Case Matching Platform</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="user-chip">
              <span className="avatar">{currentUser.slice(0, 1).toUpperCase()}</span>
              <span className="user-text">
                <strong>{currentUser}</strong>
                {session?.tenantId != null && <span>Tenant {session.tenantId}</span>}
              </span>
            </div>
            <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
              <LogOut size={15} />
              <span className="hide-sm">Sign out</span>
            </button>
          </div>
        </header>

        <main className="dashboard">
          <motion.section
            className="hero"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <p className="eyebrow">
                <span className="live-dot" /> Live overview
              </p>
              <TextEffect as="h1" per="char" preset="blur" speedReveal={1.4}>
                Case dashboard
              </TextEffect>
              <p className="muted">Monitor plate matches, claim new cases and follow each vehicle's trail.</p>
            </div>

            <Magnetic intensity={0.25} range={120}>
              <motion.button
                type="button"
                className="btn btn-primary hero-btn"
                onClick={refreshCases}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
              >
                <RefreshCw size={15} className={loading ? "spin" : ""} />
                {loading ? "Refreshing…" : "Refresh"}
              </motion.button>
            </Magnetic>
          </motion.section>

          {/* Motion Primitives: cards fade + slide in one by one */}
          <AnimatedGroup as="section" className="stat-grid" preset="blur-slide">
            {cards.map((card, index) => (
              <StatCard
                key={card.key}
                index={index}
                label={card.label}
                value={card.value}
                total={counts.all}
                icon={card.icon}
                tone={card.tone}
                active={statusFilter === card.key}
                onClick={() => setStatusFilter(card.key)}
              />
            ))}
          </AnimatedGroup>

          <CasesTable
            cases={cases}
            counts={counts}
            loading={loading}
            search={search}
            onSearch={setSearch}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            selectedId={selectedCase?.id}
            claimingId={claimingId}
            currentTenantId={session?.tenantId}
            onView={openCase}
            onClaim={claimCase}
          />
        </main>

        <footer className="footer">
          <span>PlateScan · Case Matching Platform</span>
          <span>Press Esc to close case details</span>
        </footer>

        <ScanTimeline
          caseItem={selectedCase}
          scans={scans}
          loading={scansLoading}
          claimingId={claimingId}
          onClaim={claimCase}
          onClose={closeCase}
        />
      </div>
    </MotionConfig>
  );
}

export default App;
