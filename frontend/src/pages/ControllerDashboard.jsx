// src/pages/ControllerDashboard.jsx
// FILE LOCATION: src/pages/ControllerDashboard.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import "./ControllerDashboard.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://db-driven-portfolio-generator-multiuser-pq34.onrender.com/api";

const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, "");

function apiFetch(path, options = {}) {
  const token = localStorage.getItem("controller_token");
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

function apiFetchRaw(path, options = {}) {
  const token = localStorage.getItem("controller_token");
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

// ── Helpers ──
const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return iso; }
};
const timeAgo = (iso) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Icons ──
const Icon = {
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  layers: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  activity: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  code: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  star: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
  eye: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  award: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  mail: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  globe: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  hash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  premium: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  sun: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  pdf: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  upload: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ── Stat Card ──
function StatCard({ label, value, sub, icon, color, loading }) {
  return (
    <div className={`cd-stat cd-stat-${color}`}>
      <div className="cd-stat-icon">{icon}</div>
      <div className="cd-stat-body">
        <div className="cd-stat-label">{label}</div>
        <div className="cd-stat-value">
          {loading ? <span className="cd-skeleton cd-skeleton-val" /> : value}
        </div>
        {sub && <div className="cd-stat-sub">{sub}</div>}
      </div>
      <div className="cd-stat-glow" />
    </div>
  );
}

// ── User Detail Panel ──
function UserDetailPanel({ user, onClose, dark }) {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [projectModal, setProjectModal] = useState(null); // holds project object
  const username = user?.username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setData({});
    Promise.allSettled([
      apiFetch(`/u/${username}/portfolio/profile`).then(r => r.json()),
      apiFetch(`/u/${username}/portfolio/skills`).then(r => r.json()),
      apiFetch(`/u/${username}/projects`).then(r => r.json()),
      apiFetch(`/u/${username}/portfolio/achievements`).then(r => r.json()),
      apiFetch(`/u/${username}/portfolio/socials`).then(r => r.json()),
      apiFetch(`/u/${username}/portfolio/education`).then(r => r.json()),
      apiFetch(`/u/${username}/portfolio/experience`).then(r => r.json()),
      apiFetch(`/u/${username}/portfolio/languages`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .catch(() => []),
      apiFetch(`/u/${username}/resume/list-admin`).then(r => r.json()).catch(() => []),
    ]).then(results => {
      const [profile, skills, projects, achievements, socials, education, experience, languages, resumes] = results;
      setData({
        profile:      profile.status === "fulfilled"      ? profile.value      : null,
        skills:       skills.status === "fulfilled"       ? skills.value       : null,
        projects:     projects.status === "fulfilled"     ? projects.value     : null,
        achievements: achievements.status === "fulfilled" ? achievements.value : null,
        socials:      socials.status === "fulfilled"      ? socials.value      : null,
        education:    education.status === "fulfilled"    ? education.value    : null,
        experience:   experience.status === "fulfilled"   ? experience.value   : null,
        languages:    languages.status === "fulfilled"    ? languages.value    : null,
        resumes:      resumes.status === "fulfilled"      ? resumes.value      : null,
      });
    }).finally(() => setLoading(false));
  }, [username]);

  const tabs = [
    { id: "overview",   label: "Overview" },
    { id: "projects",   label: "Projects" },
    { id: "skills",     label: "Skills" },
    { id: "languages",  label: "Languages" },
    { id: "education",  label: "Education" },
    { id: "experience", label: "Experience" },
    { id: "achievements", label: "Achievements" },
    { id: "socials",    label: "Contact" },
    { id: "resume",     label: "Resume" },
    { id: "portfolio",  label: "Portfolio" },
  ];

  // API may return { data: [...] } OR the array/object directly — handle both
  const profile      = data.profile?.data      || data.profile      || {};
  const projects     = Array.isArray(data.projects?.data)     ? data.projects.data
                     : Array.isArray(data.projects)           ? data.projects     : [];
  const achievements = Array.isArray(data.achievements?.data) ? data.achievements.data
                     : Array.isArray(data.achievements)       ? data.achievements : [];
  const education    = Array.isArray(data.education?.data)    ? data.education.data
                     : Array.isArray(data.education)          ? data.education    : [];
  const experience   = Array.isArray(data.experience?.data)   ? data.experience.data
                     : Array.isArray(data.experience)         ? data.experience   : [];
  const languages    = Array.isArray(data.languages?.data)    ? data.languages.data
                     : Array.isArray(data.languages?.content) ? data.languages.content
                     : Array.isArray(data.languages)          ? data.languages    : [];
  const socials      = data.socials?.data      || data.socials      || {};
  const skillsRaw    = data.skills?.data       || data.skills       || {};
  const allSkills = ["frontend", "backend", "database", "tools"].flatMap(cat =>
    (skillsRaw[cat] || "").split(",").filter(Boolean).map(s => ({ cat, name: s.trim() }))
  );
  const resumeList = Array.isArray(data.resumes?.data) ? data.resumes.data
                   : Array.isArray(data.resumes)       ? data.resumes : [];

  return (
    <div className={`cd-panel-overlay${dark ? "" : " cd-light"}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cd-panel">
        <div className="cd-panel-bar" />
        <div className="cd-panel-header">
          <div className="cd-panel-avatar">{(username || "U")[0].toUpperCase()}</div>
          <div className="cd-panel-info">
            <div className="cd-panel-username">@{username}</div>
            <div className="cd-panel-name">{profile.name || "—"}</div>
            <div className="cd-panel-meta">
              {profile.title && <span>{profile.title}</span>}
              {profile.location && <><span className="cd-dot">·</span><span>{profile.location}</span></>}
            </div>
            <div className="cd-panel-badges">
              <span className="cd-badge cd-badge-user">User</span>
              {user?.hasPremium1 && <span className="cd-badge cd-badge-p1">{Icon.star} Premium 1</span>}
              {user?.hasPremium2 && <span className="cd-badge cd-badge-p2">{Icon.premium} Premium 2</span>}
              <span className="cd-badge cd-badge-joined">Joined {formatDate(user?.createdAt)}</span>
            </div>
          </div>
          <button className="cd-panel-close" onClick={onClose}>{Icon.x}</button>
        </div>
        <div className="cd-panel-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`cd-panel-tab${tab === t.id ? " cd-panel-tab-active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <div className="cd-panel-content">
          {loading ? (
            <div className="cd-panel-loading"><div className="cd-loader" /><span>Loading user data…</span></div>
          ) : (
            <>
              {tab === "overview" && (
                <div className="cd-panel-section">
                  <div className="cd-mini-stats">
                    {[
                      { label: "Projects", value: projects.length, color: "indigo" },
                      { label: "Skills", value: allSkills.length, color: "cyan" },
                      { label: "Achievements", value: achievements.length, color: "violet" },
                      { label: "Experience", value: experience.length, color: "emerald" },
                    ].map(s => (
                      <div key={s.label} className={`cd-mini-stat cd-mini-${s.color}`}>
                        <div className="cd-mini-val">{s.value}</div>
                        <div className="cd-mini-label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {profile.about && <div className="cd-info-block"><div className="cd-info-title">About</div><div className="cd-info-text">{profile.about}</div></div>}
                  {profile.tagline && <div className="cd-info-block"><div className="cd-info-title">Tagline</div><div className="cd-info-text">{profile.tagline}</div></div>}
                  <div className="cd-info-grid">
                    {[["Email", profile.emailPublic, Icon.mail], ["Location", profile.location, Icon.globe], ["Initials", profile.initials, Icon.hash]].filter(([, v]) => v).map(([label, val, icon]) => (
                      <div className="cd-info-row" key={label}>
                        <span className="cd-info-icon">{icon}</span>
                        <span className="cd-info-key">{label}</span>
                        <span className="cd-info-val">{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="cd-info-block">
                    <div className="cd-info-title">Portfolio Links</div>
                    <div className="cd-link-row">
                      <a href={`/${username}`} target="_blank" rel="noopener noreferrer" className="cd-link-btn">{Icon.eye} Free</a>
                      {user?.hasPremium1 && (
                        <a href={`/${username}/premium1`} target="_blank" rel="noopener noreferrer" className="cd-link-btn cd-link-p1">{Icon.premium} Premium 1</a>
                      )}
                      {user?.hasPremium2 && (
                        <a href={`/${username}/premium2`} target="_blank" rel="noopener noreferrer" className="cd-link-btn cd-link-p2">{Icon.premium} Premium 2</a>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {tab === "projects" && (
                <div className="cd-panel-section">
                  {projects.length === 0 ? <div className="cd-empty">No projects added yet.</div>
                    : projects.map((p, i) => (
                      <div className="cd-item-card" key={p.id || i} style={{ cursor: "default" }}>
                        <div className="cd-item-row" style={{ alignItems: "center" }}>
                          <span className="cd-item-serial">{i + 1}.</span>
                          <span className="cd-item-title" style={{ flex: 1 }}>{p.title}</span>
                          {p.featured && <span className="cd-badge cd-badge-featured">{Icon.star} Featured</span>}
                          <button
                            className="cd-pdf-action-btn"
                            title="View Details"
                            style={{ marginLeft: 6, flexShrink: 0 }}
                            onClick={() => setProjectModal(p)}
                          >{Icon.eye}</button>
                        </div>
                        {p.tech && (
                          <div className="cd-item-tech" style={{ marginTop: 6 }}>
                            {p.tech.split(",").map((t, ti) => <span key={ti} className="cd-tech-chip">{t.trim()}</span>)}
                          </div>
                        )}
                      </div>
                    ))}

                  {/* Project Detail Modal */}
                  {projectModal && (
                    <div
                      style={{
                        position: "fixed", inset: 0, zIndex: 500,
                        background: "rgba(5,7,20,0.82)",
                        backdropFilter: "blur(10px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 24,
                        animation: "cd-fade-in 0.18s ease",
                      }}
                      onClick={(e) => e.target === e.currentTarget && setProjectModal(null)}
                    >
                      <div style={{
                        width: "100%", maxWidth: 560,
                        background: dark ? "#0d0f28" : "#ffffff",
                        border: "1px solid rgba(99,102,241,0.3)",
                        borderRadius: 20,
                        overflow: "hidden",
                        animation: "cd-modal-in 0.26s cubic-bezier(0.22,1,0.36,1)",
                        boxShadow: "0 28px 70px rgba(0,0,0,0.45)",
                      }}>
                        {/* Modal Header */}
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "14px 18px",
                          borderBottom: "1px solid rgba(99,102,241,0.18)",
                          background: dark ? "rgba(13,15,40,0.95)" : "rgba(245,245,255,0.95)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: dark ? "#a5b4fc" : "#6366f1" }}>{Icon.code}</span>
                            <span style={{ fontWeight: 800, fontSize: 14, color: dark ? "#e2e8f0" : "#1e293b" }}>
                              {projectModal.title}
                            </span>
                            {projectModal.featured && (
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 3,
                                padding: "2px 7px", borderRadius: 999,
                                fontSize: 10, fontWeight: 800,
                                background: "rgba(250,204,21,0.12)",
                                border: "1px solid rgba(250,204,21,0.3)",
                                color: "#fbbf24",
                              }}>{Icon.star} Featured</span>
                            )}
                          </div>
                          <button
                            onClick={() => setProjectModal(null)}
                            style={{
                              width: 28, height: 28, borderRadius: 7,
                              background: "rgba(99,102,241,0.08)",
                              border: "1px solid rgba(99,102,241,0.18)",
                              color: dark ? "rgba(165,180,252,0.7)" : "#6366f1",
                              display: "grid", placeItems: "center", cursor: "pointer",
                            }}
                          >{Icon.close}</button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, maxHeight: "70vh", overflowY: "auto" }}>

                          {/* Tech Stack */}
                          {projectModal.tech && (
                            <div>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: dark ? "rgba(165,180,252,0.55)" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Tech Stack</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {projectModal.tech.split(",").map((t, ti) => (
                                  <span key={ti} className="cd-tech-chip">{t.trim()}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Status */}
                          {projectModal.status && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: dark ? "rgba(165,180,252,0.55)" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</span>
                              <span style={{
                                padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                                background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                                color: "#34d399",
                              }}>{projectModal.status}</span>
                            </div>
                          )}

                          {/* Description */}
                          {projectModal.description && (
                            <div>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: dark ? "rgba(165,180,252,0.55)" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Description</div>
                              <div style={{
                                fontSize: 13, lineHeight: 1.7,
                                color: dark ? "rgba(226,232,240,0.82)" : "#334155",
                                background: dark ? "rgba(99,102,241,0.04)" : "rgba(99,102,241,0.03)",
                                border: "1px solid rgba(99,102,241,0.1)",
                                borderRadius: 10, padding: "10px 13px",
                              }}>{projectModal.description}</div>
                            </div>
                          )}

                          {/* Links */}
                          {(projectModal.liveUrl || projectModal.repoUrl) && (
                            <div>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: dark ? "rgba(165,180,252,0.55)" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Links</div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {projectModal.liveUrl && (
                                  <a href={projectModal.liveUrl} target="_blank" rel="noopener noreferrer"
                                    style={{
                                      display: "inline-flex", alignItems: "center", gap: 5,
                                      padding: "6px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                                      background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)",
                                      color: "#22d3ee", textDecoration: "none",
                                    }}>{Icon.globe} Live Demo</a>
                                )}
                                {projectModal.repoUrl && (
                                  <a href={projectModal.repoUrl} target="_blank" rel="noopener noreferrer"
                                    style={{
                                      display: "inline-flex", alignItems: "center", gap: 5,
                                      padding: "6px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                                      background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                                      color: "#a5b4fc", textDecoration: "none",
                                    }}>{Icon.code} Repository</a>
                                )}
                              </div>
                            </div>
                          )}

                          {!projectModal.description && !projectModal.tech && !projectModal.liveUrl && !projectModal.repoUrl && (
                            <div style={{ textAlign: "center", color: "var(--cd-text-muted)", fontSize: 13, padding: "20px 0" }}>No additional details available.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {tab === "skills" && (
                <div className="cd-panel-section">
                  {["frontend", "backend", "database", "tools"].map(cat => {
                    const catSkills = allSkills.filter(s => s.cat === cat);
                    if (!catSkills.length) return null;
                    return (
                      <div key={cat} className="cd-skills-group">
                        <div className="cd-skills-cat">{cat}</div>
                        <div className="cd-skills-chips">{catSkills.map((s, i) => <span key={i} className={`cd-skill-chip cd-skill-${cat}`}>{s.name}</span>)}</div>
                      </div>
                    );
                  })}
                  {allSkills.length === 0 && <div className="cd-empty">No skills added yet.</div>}
                  {languages.length > 0 && (
                    <div className="cd-skills-group">
                      <div className="cd-skills-cat">Language Experience</div>
                      {languages.map((l, i) => (
                        <div className="cd-lang-row" key={i}>
                          <span className="cd-lang-name">{l.language || l.name || "—"}</span>
                          {l.experience && (
                            <span className="cd-lang-level" style={{
                              background: "rgba(6,182,212,0.08)",
                              border: "1px solid rgba(6,182,212,0.2)",
                              color: "#67e8f9", padding: "2px 7px",
                              borderRadius: 5, fontSize: 11, fontWeight: 700,
                            }}>{l.experience}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {tab === "languages" && (
                <div className="cd-panel-section">
                  {languages.length === 0
                    ? <div className="cd-empty">No language experience added yet.</div>
                    : languages.map((l, i) => (
                      <div className="cd-item-card" key={l.id || i}>
                        <div className="cd-item-row" style={{ alignItems: "center", gap: 10 }}>
                          <span className="cd-item-serial">{i + 1}.</span>
                          <span className="cd-item-title" style={{ flex: 1 }}>
                            {l.language || l.name || "—"}
                          </span>
                          {l.experience && (
                            <span style={{
                              padding: "3px 10px", borderRadius: 999,
                              fontSize: 11.5, fontWeight: 700,
                              background: "rgba(6,182,212,0.08)",
                              border: "1px solid rgba(6,182,212,0.25)",
                              color: "#67e8f9", flexShrink: 0,
                            }}>
                              {l.experience}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {tab === "education" && (
                <div className="cd-panel-section">
                  {education.length === 0 ? <div className="cd-empty">No education added yet.</div>
                    : education.map((e, i) => (
                      <div className="cd-item-card" key={e.id || i}>
                        <div className="cd-item-title">{e.degree}</div>
                        <div className="cd-item-sub">{e.institution} {e.year && `· ${e.year}`}</div>
                        {e.details && <div className="cd-item-desc">{e.details}</div>}
                      </div>
                    ))}
                </div>
              )}
              {tab === "experience" && (
                <div className="cd-panel-section">
                  {experience.length === 0 ? <div className="cd-empty">No experience added yet.</div>
                    : experience.map((e, i) => (
                      <div className="cd-item-card" key={e.id || i}>
                        <div className="cd-item-row">
                          <span className="cd-item-title">{e.role}</span>
                          <span className="cd-item-year">{e.start}{e.end ? ` – ${e.end}` : " – Present"}</span>
                        </div>
                        <div className="cd-item-sub">{e.company}</div>
                        {e.description && <div className="cd-item-desc">{e.description}</div>}
                      </div>
                    ))}
                </div>
              )}
              {tab === "achievements" && (
                <div className="cd-panel-section">
                  {achievements.length === 0 ? <div className="cd-empty">No achievements added yet.</div>
                    : achievements.map((a, i) => (
                      <div className="cd-item-card" key={a.id || i}>
                        <div className="cd-item-row">
                          <span className="cd-item-title">{a.title}</span>
                          {a.year && <span className="cd-item-year">{a.year}</span>}
                        </div>
                        {a.issuer && <div className="cd-item-sub">{a.issuer}</div>}
                        {a.link && <a href={a.link} target="_blank" rel="noopener noreferrer" className="cd-ext-link">{Icon.link} Link</a>}
                      </div>
                    ))}
                </div>
              )}
{tab === "socials" && (() => {
                const SKIP_KEYS = ["id", "createdAt", "updatedAt"];
                // Pretty-print camelCase keys: "ownerUsername" → "Owner Username"
                const formatKey = (k) =>
                  k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).trim();
                const socialEntries = Object.entries(socials).filter(
                  ([k, v]) => v && !SKIP_KEYS.includes(k)
                );
                return (
                  <div className="cd-panel-section">
                    {socialEntries.length === 0
                      ? <div className="cd-empty">No contact info added yet.</div>
                      : (
                        <div className="cd-info-grid">
                          {socialEntries.map(([key, val]) => (
                            <div className="cd-info-row" key={key}>
                              <span className="cd-info-icon">{Icon.link}</span>
                              <span className="cd-info-key" style={{ width: 110, minWidth: 110 }}>{formatKey(key)}</span>
                              <span className="cd-info-val">
                                {typeof val === "string" && val.startsWith("http")
                                  ? <a href={val} target="_blank" rel="noopener noreferrer" className="cd-ext-link">{val}</a>
                                  : String(val ?? "")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                );
              })()}
 
              {tab === "resume" && (
                <div className="cd-panel-section">
                  {resumeList.length === 0 ? (
                    <div className="cd-empty">No resumes uploaded yet.</div>
                  ) : resumeList.map((r, i) => (
                    <div className="cd-item-card" key={r.id || i} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <div style={{ color: "var(--cd-text-muted)", flexShrink: 0 }}>{Icon.pdf}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="cd-item-title" style={{ fontSize: 13 }}>{r.fileName || "Resume.pdf"}</div>
                        <div className="cd-item-sub">{r.uploadedAt ? formatDate(r.uploadedAt) : ""}</div>
                      </div>
                      {r.primary && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "2px 8px", borderRadius: 999,
                          fontSize: 10.5, fontWeight: 800,
                          background: "rgba(16,185,129,0.12)",
                          border: "1px solid rgba(16,185,129,0.28)",
                          color: "#6ee7b7", flexShrink: 0,
                        }}>
                          {Icon.check} Active
                        </span>
                      )}
                      {r.id && (
                        <a
                          href={`${API_BASE}/u/${username}/resume/view/${r.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cd-pdf-action-btn"
                          title="Preview"
                          style={{ textDecoration: "none" }}
                        >
                          {Icon.eye}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
 
              {tab === "portfolio" && (
                <div className="cd-panel-section">
                  <div className="cd-info-title" style={{ marginBottom: 8 }}>Generated Portfolios</div>
                  {[
                    { label: "Free Portfolio",     key: "free",     href: `/${username}`,         color: "#16a34a", always: true },
                    { label: "Premium 1 Portfolio", key: "premium1", href: `/${username}/premium1`, color: "#7a3f91", show: user?.hasPremium1 },
                    { label: "Premium 2 Portfolio", key: "premium2", href: `/${username}/premium2`, color: "#7c3aed", show: user?.hasPremium2 },
                  ].map(tier => {
                    const isUnlocked = tier.always || tier.show;
                    return (
                      <div key={tier.key} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 10,
                        background: isUnlocked ? `${tier.color}10` : "rgba(99,102,241,0.04)",
                        border: `1px solid ${isUnlocked ? `${tier.color}35` : "rgba(99,102,241,0.1)"}`,
                        marginBottom: 0,
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: isUnlocked ? `${tier.color}20` : "rgba(99,102,241,0.1)",
                          border: `1px solid ${isUnlocked ? `${tier.color}40` : "rgba(99,102,241,0.15)"}`,
                          display: "grid", placeItems: "center", flexShrink: 0,
                          color: isUnlocked ? tier.color : "var(--cd-text-muted)",
                        }}>
                          {isUnlocked ? Icon.check : Icon.x}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: isUnlocked ? "var(--cd-text)" : "var(--cd-text-muted)" }}>
                            {tier.label}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--cd-text-muted)", marginTop: 2 }}>
                            {isUnlocked ? "Unlocked & accessible" : "Not unlocked"}
                          </div>
                        </div>
                        {isUnlocked && (
                          <a
                            href={tier.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cd-pdf-action-btn"
                            title="Open Portfolio"
                            style={{ textDecoration: "none" }}
                          >
                            {Icon.eye}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PDF Preview Modal ──
function PdfPreviewModal({ open, title, url, onClose, dark }) {
  if (!open) return null;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(5,7,20,0.85)",
        backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        animation: "cd-fade-in 0.2s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "100%", maxWidth: 860,
        height: "88vh",
        background: dark ? "#0d0f28" : "#ffffff",
        border: "1px solid rgba(99,102,241,0.3)",
        borderRadius: 20,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        animation: "cd-modal-in 0.28s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: `1px solid ${dark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.12)"}`,
          background: dark ? "rgba(13,15,40,0.9)" : "rgba(255,255,255,0.95)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: dark ? "#a5b4fc" : "#4f46e5" }}>
            {Icon.pdf}
            <span style={{ fontWeight: 800, fontSize: 14, color: dark ? "#e2e8f0" : "#1e293b" }}>{title}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)",
              color: dark ? "rgba(165,180,252,0.7)" : "#6366f1",
              display: "grid", placeItems: "center", cursor: "pointer",
            }}
          >{Icon.close}</button>
        </div>
 
        {/* PDF iframe */}
        <div style={{ flex: 1, overflow: "hidden", background: "#000" }}>
          {url ? (
            <iframe
              src={isMobile
                ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
                : `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              title={title}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(148,163,184,0.6)", fontSize: 13 }}>
              No PDF available.
            </div>
          )}
        </div>
 
        {/* Bottom bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "12px 20px",
          borderTop: `1px solid ${dark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.12)"}`,
          background: dark ? "rgba(13,15,40,0.9)" : "rgba(255,255,255,0.95)",
          flexShrink: 0, gap: 10,
        }}>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 8,
                background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)",
                color: dark ? "#a5b4fc" : "#4f46e5",
                fontSize: 12.5, fontWeight: 700, textDecoration: "none", transition: "all 0.15s",
              }}
            >
              {Icon.eye} Open in new tab
            </a>
          )}
          <button
            onClick={onClose}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 8,
              background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)",
              color: dark ? "rgba(253,164,175,0.8)" : "#e11d48",
              fontSize: 12.5, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {Icon.close} Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PDF Upload Section ──
function PdfUploadPage({ dark }) {
  const [pdfs, setPdfs] = useState({ premium1: [], premium2: [] });
  const [uploading, setUploading] = useState({ premium1: false, premium2: false });
  const [previewModal, setPreviewModal] = useState({ open: false, title: "", url: "" });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPdfs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/master-admin/preview-pdfs");
      if (res.ok) {
        const data = await res.json();
        setPdfs({
          premium1: Array.isArray(data.premium1) ? data.premium1 : [],
          premium2: Array.isArray(data.premium2) ? data.premium2 : [],
        });
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPdfs(); }, [fetchPdfs]);

  const handleUpload = async (tier, file) => {
    if (!file) return;
    if (file.type !== "application/pdf") { setErr("Only PDF files are allowed."); return; }
    setErr(""); setOk("");
    setUploading(p => ({ ...p, [tier]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tier", tier);
      const token = localStorage.getItem("controller_token");
      const res = await fetch(`${API_BASE}/master-admin/preview-pdfs/upload`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOk(`${tier === "premium1" ? "Premium 1" : "Premium 2"} PDF uploaded successfully.`);
      await fetchPdfs();
    } catch (e) {
      setErr("Upload failed: " + e.message);
    } finally {
      setUploading(p => ({ ...p, [tier]: false }));
    }
  };

  const handleDelete = async (tier, id) => {
    if (!window.confirm("Delete this PDF?")) return;
    setErr(""); setOk("");
    try {
      const res = await apiFetch(`/master-admin/preview-pdfs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOk("PDF deleted.");
      await fetchPdfs();
    } catch (e) { setErr("Delete failed: " + e.message); }
  };

  const openPreview = (tier, item) => {
    const url = `${API_BASE}/master-admin/preview-pdfs/${item.id}/view`;
    setPreviewModal({ open: true, title: `${tier === "premium1" ? "Premium 1" : "Premium 2"} — ${item.fileName}`, url });
  };

  const renderTier = (tier, label, accentClass) => {
    const items = pdfs[tier] || [];
    const isUploading = uploading[tier];
    return (
      <div className="cd-pdf-tier">
        <div className={`cd-pdf-tier-header ${accentClass}`}>
          <div className="cd-pdf-tier-label">
            {Icon.pdf}
            <span>{label}</span>
            <span className="cd-pdf-count">{items.length} file{items.length !== 1 ? "s" : ""}</span>
          </div>
          <label className={`cd-pdf-upload-btn ${accentClass}`}>
            {isUploading ? (
              <><div className="cd-loader-sm" /> Uploading…</>
            ) : (
              <>{Icon.upload} Upload PDF</>
            )}
            <input hidden type="file" accept="application/pdf" disabled={isUploading} onChange={e => e.target.files?.[0] && handleUpload(tier, e.target.files[0])} />
          </label>
        </div>

        {loading ? (
          <div className="cd-pdf-list">
            {[1, 2].map(i => <div key={i} className="cd-pdf-item"><span className="cd-skeleton" style={{ width: "60%" }} /></div>)}
          </div>
        ) : items.length === 0 ? (
          <div className="cd-pdf-empty">
            <div className="cd-pdf-empty-icon">{Icon.pdf}</div>
            <div>No PDF uploaded yet.</div>
            <div style={{ fontSize: "11px", marginTop: 4, opacity: 0.55 }}>Upload a PDF to show as preview in VersionPickerModal</div>
          </div>
        ) : (
          <div className="cd-pdf-list">
            {items.map((item, idx) => (
              <div className="cd-pdf-item" key={item.id || idx}>
                <div className="cd-pdf-item-icon">{Icon.pdf}</div>
                <div className="cd-pdf-item-info">
                  <div className="cd-pdf-item-name">{item.fileName}</div>
                  <div className="cd-pdf-item-meta">{formatDate(item.uploadedAt)}</div>
                </div>
                {item.active && <span className="cd-pdf-active-chip">Active</span>}
                <div className="cd-pdf-item-actions">
                  <button className="cd-pdf-action-btn" title="Preview" onClick={() => openPreview(tier, item)}>{Icon.eye}</button>
                  <button className="cd-pdf-action-btn cd-pdf-action-del" title="Delete" onClick={() => handleDelete(tier, item.id)}>{Icon.trash}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cd-pdf-hint">
          💡 The most recently uploaded PDF will be shown as the preview when users click the 👁 icon in the Version Picker.
        </div>
      </div>
    );
  };

  return (
    <div className="cd-page-enter">
      {err && <div className="cd-alert cd-alert-err">{Icon.x} {err}</div>}
      {ok && <div className="cd-alert cd-alert-ok">{Icon.check} {ok}</div>}
      <div className="cd-pdf-page">
        {renderTier("premium1", "Premium 1 Preview PDF", "cd-tier-p1")}
        {renderTier("premium2", "Premium 2 Preview PDF", "cd-tier-p2")}
      </div>
      <PdfPreviewModal open={previewModal.open} title={previewModal.title} url={previewModal.url} onClose={() => setPreviewModal({ open: false, title: "", url: "" })} dark={dark} />
    </div>
  );
}

// ════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════
export default function ControllerDashboard() {
  const controllerName = localStorage.getItem("controller_name") || "Controller";

  // ── theme ──
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("cd_theme");
    return saved !== null ? saved === "dark" : true;
  });

  useEffect(() => {
    localStorage.setItem("cd_theme", dark ? "dark" : "light");
  }, [dark]);

  // ── sidebar ──
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  // ── users ──
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    document.title = "Controller Dashboard";
    if (!localStorage.getItem("controller_token")) {
      window.location.replace("/controller/login");
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await apiFetch("/master-admin/users");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("controller_token");
          window.location.replace("/controller/login");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setUsers(arr);
      setLastRefresh(new Date());
    } catch (e) {
      setErr("Failed to load users. Backend may be down.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const logout = () => {
    localStorage.removeItem("controller_token");
    localStorage.removeItem("controller_name");
    window.location.replace("/controller/login");
  };

  const filtered = users.filter(u =>
    !search ||
    (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const activeToday = users.filter(u => {
    if (!u.lastLogin) return false;
    return Date.now() - new Date(u.lastLogin).getTime() < 86400000;
  }).length;

  // ── Nav items ──
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Icon.dashboard },
    { id: "users", label: "Users", icon: Icon.users },
    { id: "pdfs", label: "Preview PDFs", icon: Icon.pdf },
  ];

  const pageLabel = { dashboard: "Overview", users: "Registered Users", pdfs: "Preview PDFs" };

  return (
    <div className={`cd-root${dark ? "" : " cd-light"}`}>
      {/* Background */}
      <div className="cd-bg">
        <div className="cd-grid" />
        <div className="cd-orb cd-orb-a" />
        <div className="cd-orb cd-orb-b" />
        <div className="cd-scan" />
      </div>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && <div className="cd-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`cd-sidebar${sidebarOpen ? " cd-sidebar-open" : ""}`}>
        <div className="cd-sidebar-header">
          <div className="cd-sidebar-logo">
            <div className="cd-logo-icon">{Icon.shield}</div>
            <div>
              <div className="cd-logo-title">Controller</div>
              <div className="cd-logo-sub">Platform Portal</div>
            </div>
          </div>
        </div>

        <div className="cd-sidebar-nav">
          <div className="cd-nav-section-label">Navigation</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`cd-nav-item${activePage === item.id ? " cd-nav-item-active" : ""}`}
              onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
            >
              <span className="cd-nav-icon">{item.icon}</span>
              <span className="cd-nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="cd-sidebar-footer">
          <div className="cd-sidebar-user">
            <div className="cd-ctrl-avatar">{controllerName[0]?.toUpperCase()}</div>
            <div>
              <div className="cd-ctrl-name">{controllerName}</div>
              <div className="cd-ctrl-role">Master Controller</div>
            </div>
          </div>
          <button className="cd-logout-btn" onClick={logout}>{Icon.logout} Logout</button>
        </div>
      </aside>

      {/* Main content */}
      <div className="cd-main-wrap">
        {/* Top bar */}
        <header className="cd-header">
          <div className="cd-header-left">
            <button className="cd-icon-btn cd-menu-btn" onClick={() => setSidebarOpen(p => !p)}>{Icon.menu}</button>
            <div className="cd-header-page-title">{pageLabel[activePage] || "Dashboard"}</div>
          </div>

          <div className="cd-header-center">
            <div className="cd-status-dot" />
            <span className="cd-status-text">System Operational</span>
            {lastRefresh && <span className="cd-refresh-time">Synced {timeAgo(lastRefresh)}</span>}
          </div>

          <div className="cd-header-right">
            <button className="cd-icon-btn" onClick={() => setDark(d => !d)} title="Toggle theme">
              {dark ? Icon.sun : Icon.moon}
            </button>
            {activePage === "users" && (
              <button className="cd-icon-btn" onClick={fetchUsers} title="Refresh">{Icon.refresh}</button>
            )}
          </div>
        </header>

        <main className="cd-main">
          {/* ── DASHBOARD PAGE ── */}
          {activePage === "dashboard" && (
            <div className="cd-page-enter">
              <div className="cd-stats">
                <StatCard label="Registered Users" value={totalUsers} sub="All time" icon={Icon.users} color="indigo" loading={loading} />
                <StatCard label="Active Today" value={activeToday} sub="Last 24 hours" icon={Icon.activity} color="cyan" loading={loading} />
                <StatCard label="Portfolios" value={totalUsers} sub="Auto-generated" icon={Icon.layers} color="violet" loading={loading} />
                <StatCard label="Platform Version" value="v2.0" sub="Premium system" icon={Icon.award} color="emerald" loading={false} />
              </div>

              {/* Recent users table */}
              <div className="cd-section">
                <div className="cd-section-header">
                  <div>
                    <div className="cd-section-title">Recent Users</div>
                    <div className="cd-section-sub">Latest registrations</div>
                  </div>
                  <button className="cd-text-btn" onClick={() => setActivePage("users")}>View All →</button>
                </div>
                <div className="cd-table-wrap">
                  <table className="cd-table">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>User</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="cd-skeleton-row">{Array.from({ length: 5 }).map((_, j) => <td key={j}><span className="cd-skeleton" /></td>)}</tr>
                      )) : users.slice(0, 5).map((u, i) => (
                        <tr key={u.id || i} className="cd-row" onClick={() => { setSelectedUser(u); setActivePage("users"); }}>
                          <td className="cd-td-num">{i + 1}</td>
                          <td>
                            <div className="cd-user-cell">
                              <div className="cd-user-avatar">{(u.username || "?")[0]?.toUpperCase()}</div>
                              <div><div className="cd-username">@{u.username}</div></div>
                            </div>
                          </td>
                          <td className="cd-td-email">{u.email || "—"}</td>
                          <td>
                            <span className={`cd-status-chip ${u.enabled !== false ? "cd-status-active" : "cd-status-inactive"}`}>
                              {u.enabled !== false ? <>{Icon.check} Active</> : <>{Icon.x} Inactive</>}
                            </span>
                          </td>
                          <td className="cd-td-date">{formatDate(u.createdAt)}</td>
                        </tr>
                      ))}
                      {!loading && users.length === 0 && (
                        <tr><td colSpan={5} className="cd-empty-row">No users registered yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── USERS PAGE ── */}
          {activePage === "users" && (
            <div className="cd-page-enter">
              {err && <div className="cd-error-banner">{Icon.x}{err}</div>}
              <div className="cd-section">
                <div className="cd-section-header">
                  <div>
                    <div className="cd-section-title">Registered Users</div>
                    <div className="cd-section-sub">
                      {loading ? "Loading…" : `${filtered.length} of ${totalUsers} user${totalUsers !== 1 ? "s" : ""}`}
                    </div>
                  </div>
                  <div className="cd-section-controls">
                    <div className="cd-search-wrap">
                      <svg className="cd-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                      <input className="cd-search" placeholder="Search username or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
                      {search && <button className="cd-search-clear" onClick={() => setSearch("")}>{Icon.x}</button>}
                    </div>
                  </div>
                </div>
                <div className="cd-table-wrap">
                  <table className="cd-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>User</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Plan</th>
                        <th>Joined</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="cd-skeleton-row">{Array.from({ length: 8 }).map((_, j) => <td key={j}><span className="cd-skeleton" /></td>)}</tr>
                      )) : filtered.length === 0 ? (
                        <tr><td colSpan={8} className="cd-empty-row">{search ? `No users matching "${search}"` : "No users registered yet."}</td></tr>
                      ) : filtered.map((u, i) => (
                        <tr key={u.id || i} className="cd-row" onClick={() => setSelectedUser(u)}>
                          <td className="cd-td-num">{i + 1}</td>
                          <td>
                            <div className="cd-user-cell">
                              <div className="cd-user-avatar">{(u.username || "?")[0]?.toUpperCase()}</div>
                              <div>
                                <div className="cd-username">@{u.username}</div>
                                {u.role && <div className="cd-user-role">{u.role}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="cd-td-email">{u.email || "—"}</td>
                          <td>
                            <span className={`cd-status-chip ${u.enabled !== false ? "cd-status-active" : "cd-status-inactive"}`}>
                              {u.enabled !== false ? <>{Icon.check} Active</> : <>{Icon.x} Inactive</>}
                            </span>
                          </td>
                          <td>
                            <div className="cd-plan-cell">
                              {u.hasPremium2
                                ? <span className="cd-plan-chip cd-plan-p2">{Icon.premium} P2</span>
                                : u.hasPremium1
                                  ? <span className="cd-plan-chip cd-plan-p1">{Icon.star} P1</span>
                                  : <span className="cd-plan-chip cd-plan-free">Free</span>}
                            </div>
                          </td>
                          <td className="cd-td-date">{formatDate(u.createdAt)}</td>
                          <td className="cd-td-date">{u.lastLogin ? timeAgo(u.lastLogin) : "—"}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="cd-actions">
                              <button className="cd-action-btn" title="View Details" onClick={() => setSelectedUser(u)}>{Icon.eye}</button>
                              <a className="cd-action-btn" href={`/${u.username}`} target="_blank" rel="noopener noreferrer" title="View Portfolio">{Icon.globe}</a>
                              <a className="cd-action-btn" href={`/${u.username}/adminpanel`} target="_blank" rel="noopener noreferrer" title="Open Admin">{Icon.shield}</a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!loading && filtered.length > 0 && (
                  <div className="cd-table-footer">
                    Showing {filtered.length} user{filtered.length !== 1 ? "s" : ""}{search && ` matching "${search}"`}{lastRefresh && <> · Refreshed {timeAgo(lastRefresh)}</>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PDF UPLOAD PAGE ── */}
          {activePage === "pdfs" && <PdfUploadPage dark={dark} />}
        </main>
      </div>

      {/* User detail panel */}
      {selectedUser && (
        <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} dark={dark} />
      )}
    </div>
  );
}