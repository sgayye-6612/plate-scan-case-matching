import { useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8000";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [scans, setScans] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      const data = await response.json();

      setToken(data.username);

      await loadCases(data.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------
  // LOAD CASES
  // -------------------------
  async function loadCases(authToken = token) {
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/v1/cases`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load cases");
      }

      const data = await response.json();

      setCases(data);
    } catch (err) {
      setError(err.message);
    }
  }

  // -------------------------
  // VIEW SCANS
  // -------------------------
  async function viewScans(caseItem) {
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/v1/cases/${caseItem.id}/scans`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load scan history");
      }

      const data = await response.json();

      setSelectedCase(caseItem);
      setScans(data);
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

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.detail || "Failed to claim case");
      }

      await loadCases();
    } catch (err) {
      setError(err.message);
    }
  }

  // -------------------------
  // LOGOUT
  // -------------------------
  function logout() {
    setToken("");
    setCases([]);
    setSelectedCase(null);
    setScans([]);
    setUsername("");
    setPassword("");
    setError("");
  }

  // -------------------------
  // LOGIN SCREEN
  // -------------------------
  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Plate Scan Case Management</h1>

          <h2>Login</h2>

          <input
            className="login-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="login-button" onClick={login}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && <p className="error-message">{error}</p>}

          <div className="demo-users">
            <strong>Demo users</strong>

            <p>agent_a / password123</p>
            <p>agent_b / password123</p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------
  // DASHBOARD
  // -------------------------
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Case Management Dashboard</h1>

          <p>
            Logged in as <strong>{token}</strong>
          </p>
        </div>

        <div>
          <button
            className="refresh-button"
            onClick={() => loadCases()}
          >
            Refresh Cases
          </button>

          <button
            className="refresh-button"
            onClick={logout}
            style={{ marginLeft: "10px" }}
          >
            Logout
          </button>
        </div>
      </header>

      {error && <p className="error-message">{error}</p>}

      {/* CASES TABLE */}

      <section className="dashboard-card">
        <h2>Cases</h2>

        {cases.length === 0 ? (
          <p>No cases found.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>VIN</th>
                  <th>Status</th>
                  <th>Tenant</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {cases.map((caseItem) => (
                  <tr key={caseItem.id}>
                    <td>{caseItem.id}</td>

                    <td>{caseItem.vin}</td>

                    <td>
                      <span
                        className={`status ${caseItem.status}`}
                      >
                        {caseItem.status}
                      </span>
                    </td>

                    <td>
                      {caseItem.tenant_id ?? "Unclaimed"}
                    </td>

                    <td>
                      <button
                        className="action-button"
                        onClick={() => viewScans(caseItem)}
                      >
                        View Scans
                      </button>

                      {caseItem.status === "pending_claim" && (
                        <button
                          className="claim-button"
                          onClick={() => claimCase(caseItem.id)}
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

      {/* SCAN HISTORY */}

      {selectedCase && (
        <section className="dashboard-card">
          <div className="section-header">
            <div>
              <h2>Scan History</h2>

              <p>
                VIN: <strong>{selectedCase.vin}</strong>
              </p>
            </div>

            <button
              className="close-button"
              onClick={() => {
                setSelectedCase(null);
                setScans([]);
              }}
            >
              Close
            </button>
          </div>

          {scans.length === 0 ? (
            <p>No scans found for this case.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Plate</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Scanned At</th>
                    <th>Image</th>
                  </tr>
                </thead>

                <tbody>
                  {scans.map((scan) => (
                    <tr key={scan.id}>
                      <td>{scan.plate}</td>

                      <td>{scan.latitude}</td>

                      <td>{scan.longitude}</td>

                      <td>{scan.scanned_at}</td>

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
                          "N/A"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;