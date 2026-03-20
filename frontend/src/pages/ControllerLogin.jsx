// src/pages/ControllerLogin.jsx
// FILE LOCATION: src/pages/ControllerLogin.jsx
import React, { useState } from "react";
import "./ControllerLogin.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://db-driven-portfolio-generator-multiuser-pq34.onrender.com/api";

async function controllerLogin(username, password) {
  const res = await fetch(`${API_BASE}/master-admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json();
}

export default function ControllerLogin() {
  React.useEffect(() => {
    document.title = "Controller Portal";
  }, []);

  React.useEffect(() => {
    if (localStorage.getItem("controller_token")) {
      window.location.replace("/controller/dashboard");
    }
  }, []);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPass, setShowPass] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await controllerLogin(username.trim(), password);
      if (!data?.token) throw new Error("No token");
      localStorage.setItem("controller_token", data.token);
      localStorage.setItem("controller_name", data.username || username.trim());
      window.location.replace("/controller/dashboard");
    } catch {
      setErr("Invalid controller credentials. Access denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cl-root">
      {/* Animated background */}
      <div className="cl-bg">
        <div className="cl-grid" />
        <div className="cl-orb cl-orb-1" />
        <div className="cl-orb cl-orb-2" />
        <div className="cl-orb cl-orb-3" />
        <div className="cl-scan-line" />
      </div>

      {/* Corner decorations */}
      <div className="cl-corner cl-corner-tl" />
      <div className="cl-corner cl-corner-tr" />
      <div className="cl-corner cl-corner-bl" />
      <div className="cl-corner cl-corner-br" />

      {/* Back */}
      <button className="cl-back" onClick={() => window.history.back()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M5 12l7-7M5 12l7 7" />
        </svg>
        Back to Admin Login
      </button>

      <div className="cl-card">
        {/* Top accent bar */}
        <div className="cl-card-bar" />

        {/* Icon */}
        <div className="cl-icon-wrap">
          <div className="cl-icon-ring cl-icon-ring-1" />
          <div className="cl-icon-ring cl-icon-ring-2" />
          <div className="cl-icon-core">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="cl-title">Controller Portal</div>
        <div className="cl-subtitle">⚡ Restricted System Access · Master Level</div>

        {/* Warning */}
        <div className="cl-warning">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Unauthorized access is prohibited and will be logged.
        </div>

        {err && (
          <div className="cl-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="cl-form">
          <div className="cl-field">
            <label className="cl-label">Controller Username</label>
            <div className="cl-input-wrap">
              <svg className="cl-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                className="cl-input"
                placeholder="Enter controller username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className="cl-field">
            <label className="cl-label">Controller Password</label>
            <div className="cl-input-wrap">
              <svg className="cl-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input
                type={showPass ? "text" : "password"}
                className="cl-input"
                placeholder="Enter controller password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="cl-eye-btn"
                onClick={() => setShowPass((p) => !p)}
                tabIndex={-1}
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="cl-submit" disabled={loading}>
            {loading ? (
              <>
                <div className="cl-spinner" />
                Authenticating…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Authorize Access
              </>
            )}
          </button>
        </form>

        <div className="cl-footer">Platform Controller · Master Access · v2.0</div>
      </div>
    </div>
  );
}