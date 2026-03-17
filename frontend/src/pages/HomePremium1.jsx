// frontend/src/pages/HomePremium1.jsx
// ─────────────────────────────────────────────────────────────────────────────
// SOLARIS GRID — Premium Portfolio Viewer
// Vibrant coral-gold-electric aesthetic with bold asymmetric layout,
// animated orbital rings, data-grid panels, and kinetic scroll reveals.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CircularProgress, Dialog, DialogTitle, DialogContent, IconButton, Tooltip
} from "@mui/material";
import http from "../api/http";
import {
  MdEmail, MdPhone, MdOpenInNew, MdArrowBack,
  MdWorkspacePremium, MdLocationOn, MdDownload,
  MdCode, MdClose, MdPictureAsPdf, MdLightMode,
  MdDarkMode, MdWork, MdSchool, MdEmojiEvents,
  MdPerson, MdContacts, MdBusiness, MdCalendarToday,
  MdStar, MdLink, MdAdminPanelSettings,
  MdHub, MdFlashOn, MdArrowOutward, MdMenu, MdKeyboardArrowDown,
  MdAutoAwesome,MdRefresh,
} from "react-icons/md";
import {
  FaGithub, FaLinkedin, FaGlobe, FaCode, FaLayerGroup,
} from "react-icons/fa";
import "./HomePremium1.css";

import {
  getProfile, getSkills, getFeaturedProjects, getSocials,
  getAchievements, getLanguageExperience, getEducation, getExperience,
  getAllProjectsAdmin,
} from "../api/portfolio";

// ── API base — mirrors the exact priority order used in Home.jsx ───────────
// VITE_API_BASE takes priority, then VITE_API_URL, then hardcoded fallback
const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL  ||
  "https://db-driven-portfolio-generator-multiuser-pq34.onrender.com/api"
);
const BACKEND_BASE = API_BASE.replace(/\/api$/, "");

function safe(v) { return v == null ? "" : String(v); }
function parseList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return v.split(",").map(s => s.trim()).filter(Boolean);
}
const isMobileDevice = () => /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

// ── Resume helpers (ported from Home.jsx) ─────────────────────────────────
async function blobDownload(url) {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  let filename = "Resume.pdf";
  const cd = res.headers.get("content-disposition") || "";
  const match =
    cd.match(/filename\*=UTF-8''([^;]+)/i) ||
    cd.match(/filename="([^"]+)"/i) ||
    cd.match(/filename=([^;]+)/i);
  if (match?.[1]) {
    try { filename = decodeURIComponent(match[1]).replace(/["']/g, "").trim(); }
    catch { filename = String(match[1]).replace(/["']/g, "").trim(); }
    if (!filename.toLowerCase().endsWith(".pdf")) filename += ".pdf";
  }
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(objUrl);
  return filename;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HomePremium1() {
  const { username } = useParams();
  const navigate     = useNavigate();

  const [loading,        setLoading]        = useState(true);
  const [profile,        setProfile]        = useState({});
  const [skills,         setSkills]         = useState({});
  const [projects,       setProjects]       = useState([]);
  const [socials,        setSocials]        = useState({});
  const [achievements,   setAchievements]   = useState([]);
  const [languages,      setLanguages]      = useState([]);
  const [education,      setEducation]      = useState([]);
  const [experience,     setExperience]     = useState([]);
  const [theme,          setTheme]          = useState("dark");
  const [activeSection,  setActiveSection]  = useState("hero");
  const [mobileNav,      setMobileNav]      = useState(false);
  const [scrolled,       setScrolled]       = useState(false);

  // resume state (same pattern as Home.jsx)
  const [resumeName,           setResumeName]           = useState("Resume.pdf");
  const [downloading,          setDownloading]          = useState(false);
  const [resumePreviewOpen,    setResumePreviewOpen]    = useState(false);
  const [resumePreviewTitle,   setResumePreviewTitle]   = useState("Resume Preview");
  const [resumePreviewBlobUrl, setResumePreviewBlobUrl] = useState("");
  const [resumePreviewLoading, setResumePreviewLoading] = useState(false);

  // ── Data load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!username) return;
    const load = async () => {
      setLoading(true);
      try {
        const [p, sk, pr, so, ac, la, ed, ex] = await Promise.all([
          getProfile(username), getSkills(username),
          // Try all projects first (same as admin view), fall back to featured only
          (getAllProjectsAdmin ? getAllProjectsAdmin(username) : getFeaturedProjects(username)).catch(() => getFeaturedProjects(username)),
          getSocials(username),
          getAchievements(username), getLanguageExperience(username),
          getEducation(username), getExperience(username),
        ]);
        setProfile(p?.data   || {});
        setSkills(sk?.data   || {});
        setProjects(pr?.data || []);
        setSocials(so?.data  || {});
        setAchievements(ac?.data || []);
        setLanguages(la?.data    || []);
        setEducation(ed?.data    || []);
        setExperience(ex?.data   || []);
        const localName = localStorage.getItem("active_resume_file_name") || localStorage.getItem("resume_file_name") || "";
        if (localName) setResumeName(localName);

      } catch {}
      finally { setLoading(false); }
    };
    load();
    document.title = `${username} Portfolio`;
  }, [username]);

  // ── Override #root ─────────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.getElementById("root");
    const prev = root?.getAttribute("style") || null;
    if (root) {
      root.style.maxWidth = "none"; root.style.padding = "0";
      root.style.margin = "0"; root.style.width = "100%"; root.style.overflow = "hidden";
    }
    return () => { if (root) { if (prev) root.setAttribute("style", prev); else root.removeAttribute("style"); } };
  }, []);

  // ── Scroll detection ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = document.querySelector(".sl-wrap");
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 60);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [loading]);

  // ── Resume URLs — built directly from API_BASE (no helper dependency) ──────
  const contentVersion     = localStorage.getItem("content_version") || "0";
  const resumeDownloadBase = `${API_BASE}/u/${username}/resume/download`;
  const resumeViewBase     = `${API_BASE}/u/${username}/resume/view`;

  const bust = (base) => {
    const j = base.includes("?") ? "&" : "?";
    return `${base}${j}v=${encodeURIComponent(contentVersion)}&t=${Date.now()}`;
  };
  const resumeDownloadUrlBusted = bust(resumeDownloadBase);
  const resumeViewUrlBusted     = bust(resumeViewBase);

  // ── Download (identical to Home.jsx) ──────────────────────────────────────
  const onDownloadResume = async () => {
    try {
      setDownloading(true);
      const fname = await blobDownload(resumeDownloadUrlBusted);
      localStorage.setItem("active_resume_file_name", fname);
      setResumeName(fname);
    } catch {
      try { window.open(resumeDownloadUrlBusted, "_blank"); } catch {}
    } finally { setDownloading(false); }
  };

  // ── Preview (identical to Home.jsx) ───────────────────────────────────────
const [resumePreviewBlobBase, setResumePreviewBlobBase] = useState("");
const onPreviewResume = async () => {
  try {
    setResumePreviewTitle(resumeName || "Resume Preview");
    setResumePreviewLoading(true);
    setResumePreviewOpen(true);
    const res = await http.get(resumeViewUrlBusted, { responseType: "blob" });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const objUrl = URL.createObjectURL(blob);
    setResumePreviewBlobUrl(objUrl + "#toolbar=0&navpanes=0&scrollbar=0&view=FitH");
    // store clean url for mobile Google Docs viewer
    setResumePreviewBlobUrl(objUrl);
  } catch {
    setResumePreviewBlobUrl("");
  } finally {
    setResumePreviewLoading(false);
  }
};

const closeResumePreview = () => {
  setResumePreviewOpen(false);
  if (resumePreviewBlobBase) { try { URL.revokeObjectURL(resumePreviewBlobBase); } catch {} }
  setResumePreviewBlobUrl("");
  setResumePreviewBlobBase("");
};

  // ── Derived ────────────────────────────────────────────────────────────────
  const allSkills = [...parseList(skills.frontend), ...parseList(skills.backend), ...parseList(skills.tools)];
  const isCurrent = (exp) => !safe(exp.end).trim();

  const scrollTo = (id) => {
    setActiveSection(id);
    setMobileNav(false);
    document.getElementById(`sl-sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navItems = [
    { id: "hero",     label: "Home"       },
    { id: "about",    label: "About"      },
    { id: "exp",      label: "Experience" },
    { id: "projects", label: "Projects"   },
    { id: "ach",      label: "Awards"     },
    { id: "edu",      label: "Education"  },
    { id: "contact",  label: "Contact"    },
  ];

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className={`sl-wrap sl-${theme}`}>
      <div className="sl-loader">
        <div className="sl-loader-ring" />
        <div className="sl-loader-ring sl-ring2" />
        <div className="sl-loader-icon"><MdAutoAwesome size={28} /></div>
        <p className="sl-loader-text">Initializing portfolio…</p>
      </div>
    </div>
  );

  return (
    <div className={`sl-wrap sl-${theme}`}>

      {/* ── Background canvas ───────────────────────────────────────────────── */}
      <div className="sl-bg" aria-hidden="true">
        <div className="sl-bg-mesh" />
        <div className="sl-bg-orb sl-orb-a" />
        <div className="sl-bg-orb sl-orb-b" />
        <div className="sl-bg-orb sl-orb-c" />
        <div className="sl-noise" />
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          NAVBAR
          ════════════════════════════════════════════════════════════════════════ */}
      <nav className={`sl-nav${scrolled ? " sl-nav-scrolled" : ""}`}>
        <div className="sl-nav-inner">

          {/* Brand */}
          <div className="sl-brand">
            <div className="sl-brand-mark">
              <MdAutoAwesome size={14} />
            </div>
            <span className="sl-brand-name">{safe(profile.name) || username}</span>
          </div>

          {/* Desktop pills */}
          <div className="sl-nav-links">
            {navItems.map(n => (
              <button key={n.id}
                className={`sl-navlink${activeSection === n.id ? " active" : ""}`}
                onClick={() => scrollTo(n.id)}>
                {n.label}
              </button>
            ))}
          </div>

          {/* Actions */}
<div className="sl-nav-right">

  {/* Reload */}
  <Tooltip title="Reload Data">
    <button
      className="sl-topbtn sl-topbtn-reload"
      onClick={() => window.location.reload()}
      aria-label="Reload"
    >
      <MdRefresh size={18} style={{ color: "#4af0ff" }} />
    </button>
  </Tooltip>

  {/* Theme toggle */}
  <Tooltip title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}>
    <button
      className="sl-topbtn sl-topbtn-theme"
      onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {theme === "dark"
        ? <MdLightMode size={18} style={{ color: "#ffc844" }} />
        : <MdDarkMode  size={18} style={{ color: "#4af0ff" }} />
      }
    </button>
  </Tooltip>

  {/* Admin dashboard — same pattern as Home.jsx */}
  <Tooltip title="Go to Admin">
    <button
      className="sl-topbtn sl-topbtn-admin"
      onClick={() => navigate(`/${username}/adminpanel/premium1`)}
      aria-label="Go to Admin Dashboard"
    >
      <MdAdminPanelSettings size={18} style={{ color: "#b066ff" }} />
    </button>
  </Tooltip>

  {/* Mobile hamburger */}
  <button className="sl-mobile-menu" onClick={() => setMobileNav(v => !v)}>
    <MdMenu size={20} />
  </button>
</div>


        </div>

        {/* Mobile nav drawer */}
        {mobileNav && (
          <div className="sl-mobile-nav">
            {navItems.map(n => (
              <button key={n.id} className="sl-mobile-navlink" onClick={() => scrollTo(n.id)}>{n.label}</button>
            ))}
          </div>
        )}

        {/* Skill ticker */}
        {allSkills.length > 0 && (
          <div className="sl-ticker">
            <span className="sl-ticker-tag">STACK</span>
            <div className="sl-ticker-track">
              <div className="sl-ticker-inner">
                {[...allSkills, ...allSkills, ...allSkills].map((s, i) => (
                  <span key={i} className="sl-tick-item">
                    <span className="sl-tick-dot">◆</span>{s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════════════════════════════════════
          HERO
          ════════════════════════════════════════════════════════════════════════ */}
      <section id="sl-sec-hero" className="sl-hero">

        {/* Left column — identity */}
        <div className="sl-hero-left">
          <div className="sl-hero-eyebrow">
            <span className="sl-eyebrow-dot" />
            <span>{safe(profile.title) || "Developer"}</span>
          </div>

          <h1 className="sl-hero-name">
            {(safe(profile.name) || username).split(" ").map((word, i) => (
              <span key={i} className="sl-name-word" style={{ animationDelay: `${i * 0.12}s` }}>
                {word}
              </span>
            ))}
          </h1>

          {safe(profile.tagline) && (
            <p className="sl-hero-tagline">{safe(profile.tagline)}</p>
          )}

          {safe(profile.location) && (
            <div className="sl-hero-loc">
              <MdLocationOn size={13} />
              {safe(profile.location)}
            </div>
          )}

          {(safe(profile.emailPublic) || safe(socials.email)) && (
            <div className="sl-hero-loc" style={{ marginBottom: 30 }}>
              <MdEmail size={13} />
              {safe(profile.emailPublic) || safe(socials.email)}
            </div>
          )}

          {/* CTA row */}
          <div className="sl-hero-cta">
            {safe(socials.email) && (
              <a href={`mailto:${safe(socials.email)}`} className="sl-cta-primary">
                <MdEmail size={15} />
                Hire Me
                <MdArrowOutward size={13} className="sl-cta-arrow" />
              </a>
            )}
            <button className="sl-cta-secondary" onClick={onPreviewResume}>
              <MdPictureAsPdf size={15} />
              Preview CV
            </button>
            <button className="sl-cta-ghost" onClick={onDownloadResume} disabled={downloading}>
              <MdDownload size={15} />
              {downloading ? "…" : "Download"}
            </button>
          </div>

          {/* Social links */}
          <div className="sl-hero-socials">
            {safe(socials.github) && (
              <a href={safe(socials.github)} target="_blank" rel="noopener noreferrer" className="sl-social-link" title="GitHub">
                <FaGithub size={16} />
              </a>
            )}
            {safe(socials.linkedin) && (
              <a href={safe(socials.linkedin)} target="_blank" rel="noopener noreferrer" className="sl-social-link" title="LinkedIn">
                <FaLinkedin size={16} />
              </a>
            )}
            {safe(socials.website) && (
              <a href={safe(socials.website)} target="_blank" rel="noopener noreferrer" className="sl-social-link" title="Website">
                <FaGlobe size={15} />
              </a>
            )}
            {safe(socials.email) && (
              <a href={`mailto:${safe(socials.email)}`} className="sl-social-link" title="Email">
                <MdEmail size={16} />
              </a>
            )}
          </div>
        </div>

        {/* Center — avatar orbital */}
        <div className="sl-hero-center">
          <div className="sl-orbital">
            <div className="sl-orbital-ring sl-or1" />
            <div className="sl-orbital-ring sl-or2" />
            <div className="sl-orbital-ring sl-or3" />
            <div className="sl-orbital-dot sl-od1"><span /></div>
            <div className="sl-orbital-dot sl-od2"><span /></div>
            <div className="sl-orbital-dot sl-od3"><span /></div>
            <div className="sl-avatar-frame">

              <div className="sl-avatar-initials">
                {safe(profile.initials) ||
                  (safe(profile.name) || username || "").slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="sl-status-badge">
              <span className="sl-status-pulse" />
              Available
            </div>
          </div>
        </div>

        {/* Right column — stats + skills preview */}
        <div className="sl-hero-right">
          {/* Counter cards */}
          <div className="sl-stat-grid">
            {[
              { n: experience.length,   l: "Roles",    c: "var(--sl-coral)"    },
              { n: projects.length,     l: "Projects", c: "var(--sl-electric)" },
              { n: achievements.length, l: "Awards",   c: "var(--sl-gold)"     },
              { n: education.length,    l: "Degrees",  c: "var(--sl-lime)"     },
            ].filter(s => s.n > 0).map((s, i) => (
              <div key={i} className="sl-stat-card" style={{ "--c": s.c }}>
                <span className="sl-stat-n">{s.n}</span>
                <span className="sl-stat-l">{s.l}</span>
              </div>
            ))}
          </div>

          {/* Top skill chips */}
          <div className="sl-skill-preview">
            <div className="sl-sp-label">Top Skills</div>
            <div className="sl-sp-chips">
              {parseList(skills.frontend).slice(0, 3).map((s, i) => (
                <span key={i} className="sl-chip sl-chip-fe">{s}</span>
              ))}
              {parseList(skills.backend).slice(0, 2).map((s, i) => (
                <span key={i} className="sl-chip sl-chip-be">{s}</span>
              ))}
              {parseList(skills.tools).slice(0, 2).map((s, i) => (
                <span key={i} className="sl-chip sl-chip-tool">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="sl-scroll-cue" onClick={() => scrollTo("about")}>
          <MdKeyboardArrowDown size={20} />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          ABOUT
          ════════════════════════════════════════════════════════════════════════ */}
      {safe(profile.about) && (
        <section id="sl-sec-about" className="sl-section">
          <div className="sl-section-inner">
            <div className="sl-sec-head">
              <div className="sl-sec-tag"><MdPerson size={13} /> About</div>
              <h2 className="sl-sec-title">Who I Am</h2>
            </div>
            <div className="sl-about-layout">
              <div className="sl-about-text-card">
                <div className="sl-card-corner tl" /><div className="sl-card-corner tr" />
                <div className="sl-card-corner bl" /><div className="sl-card-corner br" />
                <p className="sl-about-text">{safe(profile.about)}</p>
              </div>

              {/* Languages */}
              {languages.length > 0 && (
                <div className="sl-lang-card">
                  <div className="sl-lang-title">Language Proficiency</div>
                  {languages.map((l, i) => {
                    const pct = Math.min((parseInt(safe(l.years)) || 1) * 18, 100);
                    return (
                      <div key={i} className="sl-lang-row" style={{ "--d": `${i * 0.07}s` }}>
                        <div className="sl-lang-meta">
                          <span className="sl-lang-name">{safe(l.language || l.name)}</span>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {safe(l.level) && <span className="sl-lang-level">{safe(l.level)}</span>}
                            {safe(l.notes) && <span className="sl-lang-level" style={{ opacity: 0.5 }}>{safe(l.notes)}</span>}
                          </div>
                        </div>
                        <div className="sl-lang-bar">
                          <div className="sl-lang-fill" style={{ width: `${pct}%`, "--d": `${i * 0.1}s` }} />
                        </div>
                        <span className="sl-lang-yr">{safe(l.years) || "1"}y</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SKILLS FULL MATRIX
          ════════════════════════════════════════════════════════════════════════ */}
      {(parseList(skills.frontend).length > 0 || parseList(skills.backend).length > 0 || parseList(skills.tools).length > 0) && (
        <section id="sl-sec-skills" className="sl-section sl-section-alt">
          <div className="sl-section-inner">
            <div className="sl-sec-head">
              <div className="sl-sec-tag"><MdCode size={13} /> Skills</div>
              <h2 className="sl-sec-title">Tech Arsenal</h2>
            </div>
            <div className="sl-skills-matrix">
              {[
                { label: "Frontend", items: parseList(skills.frontend), cls: "sl-chip-fe" },
                { label: "Backend",  items: parseList(skills.backend),  cls: "sl-chip-be" },
                { label: "Tools",    items: parseList(skills.tools),    cls: "sl-chip-tool" },
                ...(parseList(skills.database).length ? [{ label: "Database", items: parseList(skills.database), cls: "sl-chip-db" }] : []),
              ].filter(g => g.items.length > 0).map((group, gi) => (
                <div key={gi} className="sl-skill-group">
                  <div className="sl-sg-label">{group.label}</div>
                  <div className="sl-sg-chips">
                    {group.items.map((s, i) => (
                      <span key={i} className={`sl-chip ${group.cls}`} style={{ animationDelay: `${(gi * 0.1) + (i * 0.04)}s` }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          EXPERIENCE
          ════════════════════════════════════════════════════════════════════════ */}
      {experience.length > 0 && (
        <section id="sl-sec-exp" className="sl-section">
          <div className="sl-section-inner">
            <div className="sl-sec-head">
              <div className="sl-sec-tag"><MdWork size={13} /> Experience</div>
              <h2 className="sl-sec-title">Work History</h2>
            </div>
            <div className="sl-timeline">
              {experience.map((e, i) => (
                <div key={i} className={`sl-tl-item${isCurrent(e) ? " sl-current" : ""}`}
                  style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="sl-tl-left">
                    <div className="sl-tl-node">
                      {isCurrent(e) ? <MdFlashOn size={12} /> : <MdWork size={10} />}
                    </div>
                    {i < experience.length - 1 && <div className="sl-tl-connector" />}
                  </div>
                  <div className="sl-tl-card">
                    <div className="sl-tl-card-top">
                      <div>
                        <div className="sl-tl-role">{safe(e.role)}</div>
                        <div className="sl-tl-company"><MdBusiness size={11} />{safe(e.company)}</div>
                      </div>
                      <div className="sl-tl-right">
                        <span className="sl-tl-dates">
                          <MdCalendarToday size={10} />
                          {safe(e.start)}{safe(e.end) ? ` – ${safe(e.end)}` : ""}
                        </span>
                        {isCurrent(e) && <span className="sl-live-pill"><span className="sl-live-dot" />Active</span>}
                      </div>
                    </div>
                    {safe(e.description) && <p className="sl-tl-desc">{safe(e.description)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          PROJECTS
          ════════════════════════════════════════════════════════════════════════ */}
      {projects.length > 0 && (
        <section id="sl-sec-projects" className="sl-section sl-section-alt">
          <div className="sl-section-inner">
            <div className="sl-sec-head">
              <div className="sl-sec-tag"><FaLayerGroup size={11} /> Projects</div>
              <h2 className="sl-sec-title">Featured Work</h2>
            </div>
            <div className="sl-projects-grid">
              {projects.map((p, i) => (
                <div key={i} className={`sl-proj-card${p.featured ? " sl-proj-featured" : ""}`}
                  style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="sl-proj-header">
                    <div className="sl-proj-terminal-dots">
                      <span /><span /><span />
                    </div>
                    <span className="sl-proj-file">
                      {safe(p.title).toLowerCase().replace(/\s+/g, "_")}.js
                    </span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {p.featured && (
                        <span className="sl-proj-badge" style={{
                          background: "rgba(255,200,68,0.15)", color: "#ffc844",
                          border: "1px solid rgba(255,200,68,0.35)"
                        }}>★ Featured</span>
                      )}
                      <span className={`sl-proj-badge ${safe(p.status) === "Completed" ? "done" : "wip"}`}>
                        {safe(p.status) || "WIP"}
                      </span>
                    </div>
                  </div>
                  <div className="sl-proj-body">
                    <div className="sl-proj-title-row">
                      <h3 className="sl-proj-title">{safe(p.title)}</h3>
                      <div className="sl-proj-links">
                        {safe(p.liveUrl) && (
                          <a href={safe(p.liveUrl)} target="_blank" rel="noopener noreferrer"
                            className="sl-proj-link sl-proj-link-live" title="Live Demo">
                            <MdOpenInNew size={13} />
                          </a>
                        )}
                        {safe(p.repoUrl) && (
                          <a href={safe(p.repoUrl)} target="_blank" rel="noopener noreferrer"
                            className="sl-proj-link sl-proj-link-repo" title="Repository">
                            <FaGithub size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                    {safe(p.description) && <p className="sl-proj-desc">{safe(p.description)}</p>}
                    {safe(p.tech) && (
                      <div className="sl-proj-tech">
                        {safe(p.tech).split(",").map(t => t.trim()).filter(Boolean).map((t, j) => (
                          <span key={j} className="sl-chip sl-chip-be">{t}</span>
                        ))}
                      </div>
                    )}
                    {/* Live + Repo text links at bottom if both exist */}
                    {(safe(p.liveUrl) || safe(p.repoUrl)) && (
                      <div className="sl-proj-url-row">
                        {safe(p.liveUrl) && (
                          <a href={safe(p.liveUrl)} target="_blank" rel="noopener noreferrer" className="sl-proj-url-link sl-url-live">
                            <MdOpenInNew size={11} /> Live Demo
                          </a>
                        )}
                        {safe(p.repoUrl) && (
                          <a href={safe(p.repoUrl)} target="_blank" rel="noopener noreferrer" className="sl-proj-url-link sl-url-repo">
                            <FaGithub size={11} /> Source Code
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="sl-proj-shine" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          ACHIEVEMENTS
          ════════════════════════════════════════════════════════════════════════ */}
      {achievements.length > 0 && (
        <section id="sl-sec-ach" className="sl-section">
          <div className="sl-section-inner">
            <div className="sl-sec-head">
              <div className="sl-sec-tag"><MdEmojiEvents size={13} /> Awards</div>
              <h2 className="sl-sec-title">Achievements</h2>
            </div>
            <div className="sl-ach-masonry">
              {achievements.map((a, i) => (
                <div key={i} className="sl-ach-card" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="sl-ach-glow-bar" />
                  <div className="sl-ach-top">
                    <div className="sl-ach-icon"><MdStar size={16} /></div>
                    <div className="sl-ach-info">
                      <h4 className="sl-ach-title">{safe(a.title)}</h4>
                      {safe(a.issuer) && <span className="sl-ach-issuer">{safe(a.issuer)}</span>}
                    </div>
                    {/* admin stores date or year */}
                    {(safe(a.date) || safe(a.year)) && (
                      <span className="sl-ach-date">{safe(a.date) || safe(a.year)}</span>
                    )}
                  </div>
                  {safe(a.description) && <p className="sl-ach-desc">{safe(a.description)}</p>}
                  <div className="sl-ach-actions">
                    {safe(a.link) && (
                      <a href={safe(a.link)} target="_blank" rel="noopener noreferrer" className="sl-ach-link sl-ach-link-ext">
                        <MdLink size={12} /> View Link
                      </a>
                    )}
                    {safe(a.certificateFileName) && (
                      <a
                        href={`${API_BASE}/portfolio/${username}/achievements/${a.id}/certificate`}
                        target="_blank" rel="noopener noreferrer"
                        className="sl-ach-link">
                        <MdPictureAsPdf size={12} /> Certificate
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          EDUCATION
          ════════════════════════════════════════════════════════════════════════ */}
      {education.length > 0 && (
        <section id="sl-sec-edu" className="sl-section sl-section-alt">
          <div className="sl-section-inner">
            <div className="sl-sec-head">
              <div className="sl-sec-tag"><MdSchool size={13} /> Education</div>
              <h2 className="sl-sec-title">Academic Journey</h2>
            </div>
            <div className="sl-edu-stack">
              {education.map((e, i) => (
                <div key={i} className="sl-edu-card" style={{ animationDelay: `${i * 0.09}s` }}>
                  <div className="sl-edu-num">0{i + 1}</div>
                  <div className="sl-edu-body">
                    <div className="sl-edu-degree">{safe(e.degree)}</div>
                    <div className="sl-edu-inst"><MdBusiness size={11} />{safe(e.institution)}</div>
                    {safe(e.year) && (
                      <span className="sl-edu-year"><MdCalendarToday size={10} />{safe(e.year)}</span>
                    )}
                    {safe(e.details) && <p className="sl-edu-detail">{safe(e.details)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          CONTACT
          ════════════════════════════════════════════════════════════════════════ */}
      {(safe(socials.email) || safe(socials.phone) || safe(socials.github) ||
        safe(socials.linkedin) || safe(socials.website)) && (
        <section id="sl-sec-contact" className="sl-section sl-contact-section">
          <div className="sl-section-inner">
            <div className="sl-sec-head">
              <div className="sl-sec-tag"><MdContacts size={13} /> Contact</div>
              <h2 className="sl-sec-title">Let's Connect</h2>
            </div>
            <div className="sl-contact-layout">
              <div className="sl-contact-headline">
                <div className="sl-contact-big">Ready to<br /><em>collaborate?</em></div>
                <p className="sl-contact-sub">Reach out through any channel below. I respond within 24 hours.</p>
                <div className="sl-contact-deco" />
              </div>
              <div className="sl-contact-channels">
                {safe(socials.email) && (
                  <a href={`mailto:${safe(socials.email)}`} className="sl-channel sl-ch-email">
                    <div className="sl-ch-icon"><MdEmail size={20} /></div>
                    <div className="sl-ch-body">
                      <span className="sl-ch-label">Email</span>
                      <span className="sl-ch-val">{safe(socials.email)}</span>
                    </div>
                    <MdArrowOutward size={14} className="sl-ch-arrow" />
                  </a>
                )}
                {safe(socials.phone) && (
                  <a href={`tel:${safe(socials.phone)}`} className="sl-channel sl-ch-phone">
                    <div className="sl-ch-icon"><MdPhone size={20} /></div>
                    <div className="sl-ch-body">
                      <span className="sl-ch-label">Phone</span>
                      <span className="sl-ch-val">{safe(socials.phone)}</span>
                    </div>
                    <MdArrowOutward size={14} className="sl-ch-arrow" />
                  </a>
                )}
                {safe(socials.github) && (
                  <a href={safe(socials.github)} target="_blank" rel="noopener noreferrer" className="sl-channel sl-ch-gh">
                    <div className="sl-ch-icon"><FaGithub size={18} /></div>
                    <div className="sl-ch-body">
                      <span className="sl-ch-label">GitHub</span>
                      <span className="sl-ch-val">View Profile</span>
                    </div>
                    <MdArrowOutward size={14} className="sl-ch-arrow" />
                  </a>
                )}
                {safe(socials.linkedin) && (
                  <a href={safe(socials.linkedin)} target="_blank" rel="noopener noreferrer" className="sl-channel sl-ch-li">
                    <div className="sl-ch-icon"><FaLinkedin size={18} /></div>
                    <div className="sl-ch-body">
                      <span className="sl-ch-label">LinkedIn</span>
                      <span className="sl-ch-val">Connect</span>
                    </div>
                    <MdArrowOutward size={14} className="sl-ch-arrow" />
                  </a>
                )}
                {safe(socials.website) && (
                  <a href={safe(socials.website)} target="_blank" rel="noopener noreferrer" className="sl-channel sl-ch-web">
                    <div className="sl-ch-icon"><FaGlobe size={16} /></div>
                    <div className="sl-ch-body">
                      <span className="sl-ch-label">Website</span>
                      <span className="sl-ch-val">Visit</span>
                    </div>
                    <MdArrowOutward size={14} className="sl-ch-arrow" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          FOOTER
          ════════════════════════════════════════════════════════════════════════ */}
      <footer className="sl-footer">
        <div className="sl-footer-inner">
          <span>Crafted by <strong>{safe(profile.name) || username}</strong></span>
          <span className="sl-footer-badge">
            <MdWorkspacePremium size={11} /> SOLARIS PREMIUM
          </span>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════════════════
          RESUME PREVIEW DIALOG (ported from Home.jsx)
          ════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={resumePreviewOpen}
        onClose={closeResumePreview}
        fullWidth maxWidth="md"
        PaperProps={{
          sx: {
            background: theme === "dark" ? "#0d0d14" : "#ffffff",
            borderRadius: "20px",
            border: theme === "dark"
              ? "1px solid rgba(255,107,74,0.22)"
              : "1px solid rgba(0,0,0,0.1)",
            overflow: "hidden",
            boxShadow: theme === "dark"
              ? "0 0 80px rgba(255,107,74,0.08)"
              : "0 24px 80px rgba(0,0,0,0.12)",
          }
        }}
      >
        <DialogTitle sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: theme === "dark" ? "rgba(255,107,74,0.06)" : "rgba(0,0,0,0.03)",
          borderBottom: theme === "dark" ? "1px solid rgba(255,107,74,0.14)" : "1px solid rgba(0,0,0,0.08)",
          color: theme === "dark" ? "#f1f5f9" : "#0f172a",
          fontFamily: "'Clash Display', 'Outfit', sans-serif",
          fontWeight: 700, fontSize: "0.95rem",
          py: 1.5, px: 2.5,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MdPictureAsPdf size={16} style={{ color: "#ff6b4a" }} />
            {resumePreviewTitle}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <IconButton size="small" title="Download"
              sx={{ color: "#ff6b4a" }} onClick={onDownloadResume}>
              <MdDownload size={16} />
            </IconButton>
            <IconButton size="small" onClick={closeResumePreview}
              sx={{ color: theme === "dark" ? "rgba(203,213,225,0.5)" : "rgba(0,0,0,0.4)" }}>
              <MdClose size={16} />
            </IconButton>
          </div>
        </DialogTitle>

        {/* Dialog content — same scrollbar-hidden iframe pattern from Home.jsx */}
        <DialogContent sx={{ p: 0, height: { xs: 480, md: 580 }, overflow: "hidden", background: "black" }}>
          {resumePreviewLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
              <CircularProgress size={24} sx={{ color: "#ff6b4a" }} />
              <span style={{ color: "#ff6b4a", fontFamily: "monospace", fontSize: "0.85rem" }}>Loading resume…</span>
            </div>
         ) : resumePreviewBlobUrl ? (
  isMobileDevice()
    ? <iframe
        src={`https://docs.google.com/viewer?url=${encodeURIComponent(resumeViewUrlBusted)}&embedded=true`}
        width="100%" height="100%"
        style={{ border: "none", display: "block" }}
        title="Resume"
      />
    : <div style={{
        width: "100%", height: "100%",
        overflowY: "scroll", overflowX: "hidden",
        position: "relative",
        scrollbarWidth: "none", msOverflowStyle: "none",
      }}>
        <div style={{
          position: "absolute", right: 0, top: 0,
          width: 14, height: "100%",
          background: theme === "dark" ? "#000" : "#fff",
          zIndex: 10, pointerEvents: "none",
        }} />
        <iframe
          title="Resume Preview"
          src={resumePreviewBlobUrl}
          style={{ width: "100%", height: "200%", border: "none", display: "block" }}
        />
      </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%",
              color: "#64748b", fontFamily: "monospace", fontSize: "0.85rem" }}>
              Preview not available.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}