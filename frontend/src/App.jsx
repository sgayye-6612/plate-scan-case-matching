import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8000";

function getLocationName(latitude, longitude) {
  const locations = [
    { name: "Atlanta, Georgia", lat: 33.7490, lng: -84.3880 },
    { name: "Newark, New Jersey", lat: 40.7357, lng: -74.1724 },
    { name: "New York, New York", lat: 40.7128, lng: -74.0060 },
    { name: "Hartford, Connecticut", lat: 41.7658, lng: -72.6734 },
    { name: "Atlantic City, New Jersey", lat: 39.3643, lng: -74.4229 },
    { name: "Las Vegas, Nevada", lat: 36.1699, lng: -115.1398 },
    { name: "Phoenix, Arizona", lat: 33.4484, lng: -112.0740 },
  ];

  const location = locations.find(
    (item) =>
      Math.abs(item.lat - Number(latitude)) < 0.01 &&
      Math.abs(item.lng - Number(longitude)) < 0.01
  );

  return location ? location.name : "Unknown Location";
}

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [scans, setScans] = useState([]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [totalScans, setTotalScans] = useState(0);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(false);

  // -------------------------
  // LOGIN
  // -------------------------
  async function login() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // Current backend uses username as the bearer token
      setToken(data.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------
  // LOAD CASES
  // -------------------------
  async function loadCases() {
    if (!token) return;

    setCasesLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/v1/cases`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load cases");
      }

      setCases(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCasesLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadCases();
    }
  }, [token]);

  // -------------------------
  // VIEW SCANS
  // -------------------------
  async function viewScans(caseItem) {
    setError("");
    setSelectedCase(caseItem);
    setScans([]);
    setTotalScans(0);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/cases/${caseItem.id}/scans`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load scans");
      }

      setScans(data);
      setTotalScans(data.length);
    } catch (err) {
      setError(err.message);
    }
  }

  // -------------------------
  // CLAIM CASE
  // -------------------------
  async function claimCase(caseId) {
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/v1/cases/${caseId}/claim`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to claim case");
      }

      await loadCases();

      if (selectedCase?.id === caseId) {
        setSelectedCase(null);
        setScans([]);
        setTotalScans(0);
      }

      alert("Case claimed successfully!");
    } catch (err) {
      setError(err.message);
    }
  }

  // -------------------------
  // LOGOUT
  // -------------------------
  function logout() {
    setToken("");
    setUsername("");
    setPassword("");
    setCases([]);
    setSelectedCase(null);
    setScans([]);
    setTotalScans(0);
    setStatusFilter("all");
    setError("");
  }

  // -------------------------
  // FILTERS
  // -------------------------
  const filteredCases =
    statusFilter === "all"
      ? cases
      : cases.filter((item) => item.status === statusFilter);

  const activeCases = cases.filter(
    (item) => item.status === "active"
  ).length;

  const pendingCases = cases.filter(
    (item) => item.status === "pending_claim"
  ).length;

  // -------------------------
  // LOGIN PAGE
  // -------------------------
  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-icon">🚗</div>

          <h1>Case Matching Service</h1>

          <p className="login-subtitle">
            Recovery Agency Dashboard
          </p>

          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
          >
            <div className="form-group">
              <label htmlFor="username">Username</label>

              <input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="demo-login">
            <div className="demo-title">Demo accounts</div>
            <div>agent_a / password123</div>
            <div>agent_b / password123</div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------
  // DASHBOARD
  // -------------------------
  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Plate Scan & Case Matching</h1>

          <p>
            Vehicle recovery case management dashboard
          </p>
        </div>

        <div className="header-right">
          <span className="logged-user">
            👤 {username}
          </span>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="global-error">
          {error}
        </div>
      )}

      <main className="dashboard">
        {/* SUMMARY */}
        <section className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon">📁</div>
            <div>
              <p>Total Cases</p>
              <h2>{cases.length}</h2>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">🚨</div>
            <div>
              <p>Active Cases</p>
              <h2>{activeCases}</h2>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">⏳</div>
            <div>
              <p>Pending Claims</p>
              <h2>{pendingCases}</h2>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">📡</div>
            <div>
              <p>Viewed Scans</p>
              <h2>{totalScans}</h2>
            </div>
          </div>
        </section>

        {/* CASES */}
        <section className="content-card">
          <div className="section-header">
            <div>
              <h2>Cases</h2>

              <p>
                Cases available to your agency and claimable
                pending cases
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={loadCases}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="filters">
            <button
              className={
                statusFilter === "all"
                  ? "filter active"
                  : "filter"
              }
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>

            <button
              className={
                statusFilter === "active"
                  ? "filter active"
                  : "filter"
              }
              onClick={() => setStatusFilter("active")}
            >
              Active
            </button>

            <button
              className={
                statusFilter === "pending_claim"
                  ? "filter active"
                  : "filter"
              }
              onClick={() =>
                setStatusFilter("pending_claim")
              }
            >
              Pending Claim
            </button>

            <button
              className={
                statusFilter === "closed"
                  ? "filter active"
                  : "filter"
              }
              onClick={() => setStatusFilter("closed")}
            >
              Closed
            </button>
          </div>

          {casesLoading ? (
            <div className="loading">
              Loading cases...
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <h3>No cases found</h3>
              <p>
                There are no cases available for this filter.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>VIN</th>
                    <th>Status</th>
                    <th>Tenant</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCases.map((caseItem) => (
                    <tr key={caseItem.id}>
                      <td>
                        <strong>#{caseItem.id}</strong>
                      </td>

                      <td className="vin">
                        {caseItem.vin}
                      </td>

                      <td>
                        <span
                          className={`status ${caseItem.status}`}
                        >
                          {caseItem.status ===
                          "pending_claim"
                            ? "Pending Claim"
                            : caseItem.status
                                .charAt(0)
                                .toUpperCase() +
                              caseItem.status.slice(1)}
                        </span>
                      </td>

                      <td>
                        {caseItem.tenant_id
                          ? `Tenant ${caseItem.tenant_id}`
                          : "Claimable"}
                      </td>

                      <td className="actions">
                        <button
                          className="view-button"
                          onClick={() =>
                            viewScans(caseItem)
                          }
                        >
                          View Scans
                        </button>

                        {caseItem.status ===
                          "pending_claim" && (
                          <button
                            className="claim-button"
                            onClick={() =>
                              claimCase(caseItem.id)
                            }
                          >
                            Claim
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SCANS */}
        {selectedCase && (
          <section className="content-card scan-section">
            <div className="section-header">
              <div>
                <h2>
                  Scan History — Case #{selectedCase.id}
                </h2>

                <p>
                  VIN:{" "}
                  <strong>{selectedCase.vin}</strong>
                </p>
              </div>

              <button
                className="close-button"
                onClick={() => {
                  setSelectedCase(null);
                  setScans([]);
                  setTotalScans(0);
                }}
              >
                Close
              </button>
            </div>

            {scans.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📡</div>
                <h3>No scans found</h3>
                <p>
                  No scan records are available for this case.
                </p>
              </div>
            ) : (
              <>
                <div className="location-trail">
                  <h3>📍 Vehicle Location Trail</h3>

                  <div className="trail">
                    {scans.map((scan, index) => (
                      <div
                        className="trail-item"
                        key={scan.id}
                      >
                        <div className="trail-number">
                          {index + 1}
                        </div>

                        <div className="trail-content">
                          <strong>
                            {getLocationName(
                              scan.latitude,
                              scan.longitude
                            )}
                          </strong>

                          <span>
                            {new Date(
                              scan.scanned_at
                            ).toLocaleString()}
                          </span>

                          <small>
                            Coordinates:{" "}
                            {scan.latitude},{" "}
                            {scan.longitude}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="table-container scan-table">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Plate</th>
                        <th>Location</th>
                        <th>Coordinates</th>
                        <th>Scanned At</th>
                        <th>Image</th>
                      </tr>
                    </thead>

                    <tbody>
                      {scans.map((scan, index) => (
                        <tr key={scan.id}>
                          <td>{index + 1}</td>

                          <td>
                            <strong>{scan.plate}</strong>
                          </td>

                          <td>
                            <strong>
                              {getLocationName(
                                scan.latitude,
                                scan.longitude
                              )}
                            </strong>
                          </td>

                          <td>
                            {scan.latitude},{" "}
                            {scan.longitude}
                          </td>

                          <td>
                            {new Date(
                              scan.scanned_at
                            ).toLocaleString()}
                          </td>

                          <td>
                            {scan.image_url ? (
                              <a
                                href={scan.image_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View Image
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;