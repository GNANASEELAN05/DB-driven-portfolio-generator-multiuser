// frontend/src/pages/HomePremium1.jsx
// ─────────────────────────────────────────────────────────────────────────────
// SOLARIS GRID — Premium Portfolio Viewer v2
// Reference-quality layout: full-width sections, glassmorphism cards,
// macOS dot bars, prismatic borders, orbital rings, holographic scans.
// Desktop: rich animations. Mobile: static, no lag.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, IconButton, Tooltip,
  Skeleton, Box, Typography, useTheme,
} from "@mui/material";
import {
  MdEmail, MdPhone, MdOpenInNew, MdArrowBack,
  MdWorkspacePremium, MdLocationOn, MdDownload,
  MdCode, MdClose, MdPictureAsPdf, MdLightMode,
  MdDarkMode, MdWork, MdSchool, MdEmojiEvents,
  MdPerson, MdContacts, MdBusiness, MdCalendarToday,
  MdStar, MdLink, MdAdminPanelSettings,
  MdHub, MdFlashOn, MdArrowOutward, MdMenu, MdKeyboardArrowDown,
  MdAutoAwesome, MdRefresh, MdVisibility, MdTimeline,
} from "react-icons/md";
import { FaGithub, FaLinkedin, FaGlobe, FaCode, FaLayerGroup } from "react-icons/fa";
import "./HomePremium1.css";

import {
  getProfile, getSkills, getFeaturedProjects, getSocials,
  getAchievements, getLanguageExperience, getEducation, getExperience,
  getAllProjectsAdmin, downloadResumeUrl, viewResumeUrl,
} from "../api/portfolio";

import http from "../api/http";

// ── API base ──────────────────────────────────────────────────────────────────
const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL  ||
  "https://db-driven-portfolio-generator-multiuser-pq34.onrender.com/api"
);

function safe(v) { return v == null ? "" : String(v); }
function parseList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return String(v).split(",").map(s => s.trim()).filter(Boolean);
}
function splitCSV(s) {
  if (!s) return [];
  if (Array.isArray(s)) return s.filter(Boolean).map(x => String(x).trim()).filter(Boolean);
  return String(s).split(",").map(x => x.trim()).filter(Boolean);
}

// ── Resume blob download (same as Home.jsx) ───────────────────────────────────
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

// ── Section title component (mirrors reference SectionTitle) ─────────────────
function SectionTitle({ title, icon, accent }) {
  return (
    <div className="sp1-sec-title-row">
      <div className="sp1-sec-icon-box" style={{ "--ac": accent || "var(--sp1-coral)" }}>
        {icon}
      </div>
      <h2 className="sp1-sec-heading">{title}</h2>
    </div>
  );
}

// ── GlassCard (mirrors reference GlassCard) ───────────────────────────────────
function GlassCard({ children, sx, className }) {
  return (
    <div className={`sp1-glass-card${className ? " " + className : ""}`} style={sx}>
      {children}
    </div>
  );
}

// ── macOS dots bar ────────────────────────────────────────────────────────────
function MacBar({ label, live }) {
  return (
    <div className="sp1-mac-bar">
      <div className="sp1-mac-dots">
        <span className="sp1-dot sp1-dot-red" />
        <span className="sp1-dot sp1-dot-yellow" />
        <span className="sp1-dot sp1-dot-green" />
      </div>
      {label && <span className="sp1-mac-label">{label}</span>}
      {live && (
        <span className="sp1-live-pill">
          <span className="sp1-live-dot" />
          ACTIVE
        </span>
      )}
    </div>
  );
}

// ── Project card (mirrors reference ProjectCardOneByOne style) ────────────────
function ProjectCard({ index, p }) {
  const title = safe(p?.title) || "Untitled Project";
  const description = safe(p?.description) || "";
  const techList = splitCSV(p?.tech);
  const repoUrl = safe(p?.repoUrl || "");
  const liveUrl = safe(p?.liveUrl || "");

  return (
    <div className="sp1-proj-card" style={{ "--idx": index }}>
      <MacBar label={`${title.toLowerCase().replace(/\s+/g, "_")}.js`} live={safe(p?.status) !== "Completed"} />
      <div className="sp1-proj-body">
        <div className="sp1-proj-num-row">
          <div className="sp1-proj-orb">
            <div className="sp1-proj-orb-ring sp1-por1" />
            <div className="sp1-proj-orb-ring sp1-por2" />
            <div className="sp1-proj-orb-core">
              <span className="sp1-proj-num">{index}</span>
            </div>
          </div>
          <div className="sp1-proj-title-block">
            <div className="sp1-proj-title-beam" />
            <div>
              <h3 className="sp1-proj-title">{title}</h3>
              {safe(p?.status) && (
                <span className={`sp1-proj-status-chip ${safe(p?.status) === "Completed" ? "done" : "wip"}`}>
                  {safe(p?.status)}
                </span>
              )}
            </div>
          </div>
          <div className="sp1-proj-icon-links">
            {liveUrl && (
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="sp1-proj-link sp1-link-live" title="Live Demo">
                <MdOpenInNew size={13} />
              </a>
            )}
            {repoUrl && (
              <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="sp1-proj-link sp1-link-repo" title="Repository">
                <FaGithub size={12} />
              </a>
            )}
          </div>
        </div>

        {description && (
          <p className="sp1-proj-desc">{description}</p>
        )}

        {techList.length > 0 && (
          <div className="sp1-proj-tech-wrap">
            <span className="sp1-proj-tech-label">STACK</span>
            <div className="sp1-proj-chips">
              {techList.map((t, i) => (
                <span key={i} className="sp1-chip sp1-chip-tech">{t}</span>
              ))}
            </div>
          </div>
        )}

        {(repoUrl || liveUrl) && (
          <div className="sp1-proj-actions">
            {repoUrl && (
              <button className="sp1-proj-btn sp1-btn-outline" onClick={() => window.open(repoUrl, "_blank")}>
                <FaGithub size={12} /> Source Code
              </button>
            )}
            {liveUrl && (
              <button className="sp1-proj-btn sp1-btn-solid" onClick={() => window.open(liveUrl, "_blank")}>
                <MdOpenInNew size={12} /> Live Demo
              </button>
            )}
          </div>
        )}
      </div>
      <div className="sp1-proj-corner sp1-corner-tl" />
      <div className="sp1-proj-corner sp1-corner-br" />
      <div className="sp1-proj-prism" />
    </div>
  );
}

// ── Resume Preview Dialog (fixed, same as Home.jsx pattern) ──────────────────
function ResumePreviewDialog({ open, title, onClose, url, blobUrl, loading }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const src = blobUrl || url;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle
        sx={{
          fontSize: { xs: "1rem", md: "1.25rem" },
          py: 1.5,
          fontWeight: 800,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent
        sx={{
          height: { xs: 480, md: 580 },
          p: 0,
          overflow: "hidden",
          bgcolor: "black",
        }}
      >
        {loading ? (
          <Box sx={{ p: 3 }}>
            <Typography sx={{ opacity: 0.75, color: "#fff" }}>
              Loading preview…
            </Typography>
          </Box>
        ) : src ? (
          <Box sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
            <iframe
              title="Resume Preview"
              src={
                isMobile
                  ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
                  : `${src}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
              }
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              }}
            />
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography sx={{ opacity: 0.75, color: "#fff" }}>
              Preview not available.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} size="small" variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HomePremium1({ toggleTheme }) {
  const { username } = useParams();
  const navigate     = useNavigate();

  const [loading,       setLoading]       = useState(true);
  const [reloadTick,    setReloadTick]    = useState(0);
  const [profile,       setProfile]       = useState({});
  const [skills,        setSkills]        = useState({});
  const [projects,      setProjects]      = useState([]);
  const [socials,       setSocials]       = useState({});
  const [achievements,  setAchievements]  = useState([]);
  const [languages,     setLanguages]     = useState([]);
  const [education,     setEducation]     = useState([]);
  const [experience,    setExperience]    = useState([]);
  const [theme,         setTheme]         = useState("dark");
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileNav,     setMobileNav]     = useState(false);
  const [scrolled,      setScrolled]      = useState(false);

  // resume state (same as Home.jsx)
  const [resumeName,           setResumeName]           = useState("Resume.pdf");
  const [downloading,          setDownloading]          = useState(false);
  const [resumePreviewOpen,    setResumePreviewOpen]    = useState(false);
  const [resumePreviewTitle,   setResumePreviewTitle]   = useState("Resume Preview");
  const [resumePreviewBlobUrl, setResumePreviewBlobUrl] = useState("");
  const [resumePreviewLoading, setResumePreviewLoading] = useState(false);

  const wrapRef = useRef(null);

  // ── Data load (single Promise.all, same as Home.jsx) ──────────────────────
  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const tryAllProjects = getAllProjectsAdmin
          ? getAllProjectsAdmin(username).catch(() => getFeaturedProjects(username))
          : getFeaturedProjects(username);

        const [p, sk, pr, so, ac, la, ed, ex] = await Promise.all([
          getProfile(username), getSkills(username),
          tryAllProjects,
          getSocials(username),
          getAchievements(username), getLanguageExperience(username),
          getEducation(username), getExperience(username),
        ]);
        if (!alive) return;
        setProfile(p?.data   || {});
        setSkills(sk?.data   || {});
        setProjects(Array.isArray(pr?.data) ? pr.data : []);
        setSocials(so?.data  || {});
        setAchievements(Array.isArray(ac?.data) ? ac.data : []);
        setLanguages(Array.isArray(la?.data) ? la.data : []);
        setEducation(Array.isArray(ed?.data) ? ed.data : []);
        setExperience(Array.isArray(ex?.data) ? ex.data : []);

        const localName =
          localStorage.getItem("active_resume_file_name") ||
          localStorage.getItem("resume_file_name") || "";
        if (localName) setResumeName(localName);

      } catch {}
      finally { if (alive) setLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, [reloadTick]);

    useEffect(() => {
    const dispName =
      localStorage.getItem("display_name") ||
      localStorage.getItem("auth_user_original") ||
      username || "";
    if (dispName) document.title = `${dispName} Portfolio`;
  }, [username, profile]);

  // ── storage sync (same as Home.jsx) ──────────────────────────────────────
// ── storage sync — only reload when admin pushes changes from another tab ─
  // Never reload on plain focus or tab switch — only when content_version,
  // active_resume_file_name, or resume_file_name actually changes in storage.
  useEffect(() => {
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (
        e.key === "content_version" ||
        e.key === "active_resume_file_name" ||
        e.key === "resume_file_name"
      ) {
        setReloadTick(x => x + 1);
      }
    };
    // Only listen to cross-tab storage events — no focus, no visibilitychange
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // ── override #root ────────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.getElementById("root");
    const prev = root?.getAttribute("style") || null;
    if (root) {
      root.style.maxWidth = "none"; root.style.padding = "0";
      root.style.margin = "0"; root.style.width = "100%";
    }
    return () => {
      if (root) { if (prev) root.setAttribute("style", prev); else root.removeAttribute("style"); }
    };
  }, []);

  // ── scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 60);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // ── Resume URLs (same cache-bust pattern as Home.jsx) ─────────────────────
  const contentVersion = useMemo(
    () => localStorage.getItem("content_version") || "0",
    [reloadTick]
  );
  const resumeDownloadBase = useMemo(() => downloadResumeUrl(username), [username]);
  const resumeViewBase     = useMemo(() => viewResumeUrl(username), [username]);

  const bust = useCallback((base) => {
    const j = base.includes("?") ? "&" : "?";
    return `${base}${j}v=${encodeURIComponent(contentVersion)}&t=${Date.now()}`;
  }, [contentVersion]);

  const resumeDownloadUrlBusted = useMemo(() => bust(resumeDownloadBase), [bust, resumeDownloadBase]);
  const resumeViewUrlBusted     = useMemo(() => bust(resumeViewBase), [bust, resumeViewBase]);

  // ── Download resume ────────────────────────────────────────────────────────
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

const openResumePreviewInline = async (title, directUrl) => {
  try {
    setResumePreviewTitle(title || "Resume Preview");
    setResumePreviewLoading(true);
    setResumePreviewOpen(true);

    if (resumePreviewBlobUrl) {
      try {
        URL.revokeObjectURL(resumePreviewBlobUrl);
      } catch {}
    }
    setResumePreviewBlobUrl("");

    const res = await http.get(directUrl, { responseType: "blob" });
    const blob = new Blob([res.data], { type: "application/pdf" });
    setResumePreviewBlobUrl(URL.createObjectURL(blob));
  } catch {
    setResumePreviewBlobUrl("");
  } finally {
    setResumePreviewLoading(false);
  }
};

const closeResumePreview = () => {
  setResumePreviewOpen(false);
  if (resumePreviewBlobUrl) {
    try {
      URL.revokeObjectURL(resumePreviewBlobUrl);
    } catch {}
  }
  setResumePreviewBlobUrl("");
};

const onPreviewResume = async () => {
  await openResumePreviewInline(
    resumeName || "Resume Preview",
    viewResumeUrl(username)
  );
};

  // ── Derived values ────────────────────────────────────────────────────────
  const name = safe(profile?.name) || username || "Portfolio";
  const titleText = safe(profile?.title) || "Developer";
  const tagline = safe(profile?.tagline) || "";
  const about = safe(profile?.about) || "";
  const location = safe(profile?.location) || "";
  const emailPublic = safe(profile?.emailPublic) || "";

  const contactEmail = useMemo(() => {
    const ep = safe(emailPublic).trim();
    if (ep) return ep;
    return safe(socials?.email).trim();
  }, [emailPublic, socials?.email]);

  const allSkills = useMemo(() => [
    ...parseList(skills.frontend),
    ...parseList(skills.backend),
    ...parseList(skills.tools),
  ], [skills]);

  const skillCategoryRows = useMemo(() => {
    const s = skills || {};
    return [
      { category: "Frontend",  value: splitCSV(s.frontend).join(" · ") || "—" },
      { category: "Backend",   value: splitCSV(s.backend).join(" · ")  || "—" },
      { category: "Database",  value: splitCSV(s.database).join(" · ") || "—" },
      { category: "Tools",     value: splitCSV(s.tools).join(" · ")    || "—" },
    ];
  }, [skills]);

  const isCurrent = (exp) => !safe(exp?.end).trim();

  const scrollTo = (id) => {
    setActiveSection(id);
    setMobileNav(false);
    document.getElementById(`sp1-sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const reload = () => setReloadTick(x => x + 1);

  const navItems = [
    { id: "hero",     label: "Home"       },
    { id: "about",    label: "About"      },
    { id: "skills",   label: "Skills"     },
    { id: "exp",      label: "Experience" },
    { id: "projects", label: "Projects"   },
    { id: "ach",      label: "Awards"     },
    { id: "edu",      label: "Education"  },
    { id: "langs",    label: "Languages"  },
    { id: "contact",  label: "Contact"    },
  ];

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) return (
    <div className={`sp1-wrap sp1-${theme}`} ref={wrapRef}>
      <div className="sp1-loader">
        <div className="sp1-loader-ring" />
        <div className="sp1-loader-ring sp1-ring2" />
        <div className="sp1-loader-icon"><MdAutoAwesome size={28} /></div>
        <p className="sp1-loader-text">Loading portfolio…</p>
      </div>
    </div>
  );

  return (
    <div className={`sp1-wrap sp1-${theme}`} ref={wrapRef}>

      {/* ── Decorative background ──────────────────────────────────────────── */}
      <div className="sp1-bg" aria-hidden="true">
        <div className="sp1-bg-mesh" />
        <div className="sp1-bg-orb sp1-orb-a" />
        <div className="sp1-bg-orb sp1-orb-b" />
        <div className="sp1-bg-orb sp1-orb-c" />
        <div className="sp1-noise" />
      </div>

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <nav className={`sp1-nav${scrolled ? " sp1-nav-scrolled" : ""}`}>
        <div className="sp1-nav-inner">

          {/* Brand */}
          <div className="sp1-brand">
            <div className="sp1-brand-mark">
              <MdAutoAwesome size={14} />
            </div>
            <span className="sp1-brand-name">{name}</span>
          </div>

          {/* Desktop nav links */}
          <div className="sp1-nav-links">
            {navItems.map(n => (
              <button
                key={n.id}
                className={`sp1-navlink${activeSection === n.id ? " active" : ""}`}
                onClick={() => scrollTo(n.id)}
              >
                {n.label}
              </button>
            ))}
          </div>

          {/* Top action buttons */}
          <div className="sp1-nav-right">
            <Tooltip title="Reload Data">
              <button className="sp1-topbtn sp1-topbtn-reload" onClick={reload} aria-label="Reload">
                <MdRefresh size={17} />
              </button>
            </Tooltip>

            <Tooltip title={theme === "dark" ? "Light Mode" : "Dark Mode"}>
              <button
                className="sp1-topbtn sp1-topbtn-theme"
                onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <MdLightMode size={17} /> : <MdDarkMode size={17} />}
              </button>
            </Tooltip>

            <Tooltip title="Go to Admin">
              <button
                className="sp1-topbtn sp1-topbtn-admin"
                onClick={() => navigate(`/${username}/adminpanel`)}
                aria-label="Admin"
              >
                <MdAdminPanelSettings size={17} />
              </button>
            </Tooltip>

            <button className="sp1-mobile-menu" onClick={() => setMobileNav(v => !v)}>
              <MdMenu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileNav && (
          <div className="sp1-mobile-nav">
            {navItems.map(n => (
              <button key={n.id} className="sp1-mobile-navlink" onClick={() => scrollTo(n.id)}>
                {n.label}
              </button>
            ))}
          </div>
        )}

        {/* Skill ticker */}
        {allSkills.length > 0 && (
          <div className="sp1-ticker">
            <span className="sp1-ticker-tag">STACK</span>
            <div className="sp1-ticker-track">
              <div className="sp1-ticker-inner">
                {[...allSkills, ...allSkills, ...allSkills].map((s, i) => (
                  <span key={i} className="sp1-tick-item">
                    <span className="sp1-tick-dot">◆</span>{s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section id="sp1-sec-hero" className="sp1-section sp1-hero-section">
        <div className="sp1-hero-card">
          {/* macOS bar on hero */}
          <MacBar label={`${(name || "portfolio").toLowerCase().replace(/\s+/g, "_")}.jsx`} live />

          <div className="sp1-hero-inner">

            {/* Left: identity */}
            <div className="sp1-hero-left">
              <div className="sp1-hero-eyebrow">
                <span className="sp1-eyebrow-dot" />
                {titleText}
              </div>

              <h1 className="sp1-hero-name">
                {(name).split(" ").map((word, i) => (
                  <span key={i} className="sp1-name-word" style={{ "--d": `${i * 0.12}s` }}>
                    {i === 0 ? word : (
                      <span className="sp1-name-accent">{word}</span>
                    )}
                  </span>
                ))}
              </h1>

              {/* Name divider beam */}
              <div className="sp1-hero-divider" />

              {tagline && <p className="sp1-hero-tagline">{tagline}</p>}

              <div className="sp1-hero-meta">
                {location && (
                  <span className="sp1-meta-item">
                    <MdLocationOn size={13} />{location}
                  </span>
                )}
                {emailPublic && (
                  <span className="sp1-meta-item">
                    <MdEmail size={13} />{emailPublic}
                  </span>
                )}
              </div>

              {/* CTA buttons */}
              <div className="sp1-hero-cta">
                <button className="sp1-cta-primary" onClick={() => scrollTo("about")}>
                  Explore <MdKeyboardArrowDown size={15} />
                </button>
                <button className="sp1-cta-secondary" onClick={onDownloadResume} disabled={downloading}>
                  <MdDownload size={15} />
                  {downloading ? "Downloading…" : `Download (${resumeName})`}
                </button>
<button
  type="button"
  className="sp1-cta-ghost"
  onClick={onPreviewResume}
>
  <MdVisibility size={15} /> Preview CV
</button>
              </div>

              {/* Social icons */}
              <div className="sp1-hero-socials">
                {safe(socials?.github) && (
                  <a href={safe(socials.github)} target="_blank" rel="noopener noreferrer"
                    className="sp1-social-btn" title="GitHub">
                    <FaGithub size={16} />
                  </a>
                )}
                {safe(socials?.linkedin) && (
                  <a href={safe(socials.linkedin)} target="_blank" rel="noopener noreferrer"
                    className="sp1-social-btn" title="LinkedIn">
                    <FaLinkedin size={16} />
                  </a>
                )}
                {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="sp1-social-btn" title="Email">
                    <MdEmail size={16} />
                  </a>
                )}
                {safe(socials?.website) && (
                  <a href={safe(socials.website)} target="_blank" rel="noopener noreferrer"
                    className="sp1-social-btn" title="Website">
                    <FaGlobe size={15} />
                  </a>
                )}
                {safe(socials?.phone) && (
                  <a href={`tel:${safe(socials.phone)}`} className="sp1-social-btn" title="Phone">
                    <MdPhone size={15} />
                  </a>
                )}
              </div>
            </div>

            {/* Center: orbital avatar */}
            <div className="sp1-hero-center">
              <div className="sp1-orbital">
                <div className="sp1-or sp1-or1" />
                <div className="sp1-or sp1-or2" />
                <div className="sp1-or sp1-or3" />
                <div className="sp1-od sp1-od1"><span /></div>
                <div className="sp1-od sp1-od2"><span /></div>
                <div className="sp1-od sp1-od3"><span /></div>
                <div className="sp1-avatar-frame">
                  <div className="sp1-avatar-initials">
                    {safe(profile?.initials) ||
                      (name || username || "").slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="sp1-status-badge">
                  <span className="sp1-status-pulse" />
                  Available
                </div>
              </div>
            </div>

            {/* Right: stats */}
            <div className="sp1-hero-right">
              <div className="sp1-stat-grid">
                {[
                  { n: experience.length,   l: "Roles",    c: "var(--sp1-coral)"    },
                  { n: projects.length,     l: "Projects", c: "var(--sp1-electric)" },
                  { n: achievements.length, l: "Awards",   c: "var(--sp1-gold)"     },
                  { n: education.length,    l: "Degrees",  c: "var(--sp1-lime)"     },
                ].filter(s => s.n > 0).map((s, i) => (
                  <div key={i} className="sp1-stat-card" style={{ "--c": s.c }}>
                    <span className="sp1-stat-n">{s.n}</span>
                    <span className="sp1-stat-l">{s.l}</span>
                  </div>
                ))}
              </div>

              <div className="sp1-hero-skill-preview">
                <div className="sp1-sp-label">Top Skills</div>
                <div className="sp1-sp-chips">
                  {parseList(skills.frontend).slice(0, 3).map((s, i) => (
                    <span key={i} className="sp1-chip sp1-chip-fe">{s}</span>
                  ))}
                  {parseList(skills.backend).slice(0, 2).map((s, i) => (
                    <span key={i} className="sp1-chip sp1-chip-be">{s}</span>
                  ))}
                  {parseList(skills.tools).slice(0, 2).map((s, i) => (
                    <span key={i} className="sp1-chip sp1-chip-tool">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hero corner brackets */}
          <div className="sp1-hero-corner sp1-hc-tl" />
          <div className="sp1-hero-corner sp1-hc-tr" />
          <div className="sp1-hero-corner sp1-hc-bl" />
          <div className="sp1-hero-corner sp1-hc-br" />
          <div className="sp1-hero-prism" />
        </div>
      </section>

      {/* ══ ABOUT ══════════════════════════════════════════════════════════ */}
      {about && (
        <section id="sp1-sec-about" className="sp1-section">
          <div className="sp1-section-inner">
            <SectionTitle title="About Me" icon={<MdPerson size={18} />} accent="var(--sp1-coral)" />
            <GlassCard sx={{ padding: "28px 32px" }}>
              <p className="sp1-about-text">{about}</p>
            </GlassCard>
          </div>
        </section>
      )}

      {/* ══ SKILLS ══════════════════════════════════════════════════════════ */}
      {(parseList(skills.frontend).length > 0 || parseList(skills.backend).length > 0 || parseList(skills.tools).length > 0) && (
        <section id="sp1-sec-skills" className="sp1-section sp1-section-alt">
          <div className="sp1-section-inner">
            <SectionTitle title="Skills" icon={<MdCode size={18} />} accent="var(--sp1-electric)" />
            <GlassCard sx={{ padding: "0" }}>
              <div className="sp1-skills-table-wrap">
                <table className="sp1-skills-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Skills</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillCategoryRows.filter(r => r.value !== "—").map((r, i) => (
                      <tr key={i}>
                        <td className="sp1-skills-cat">{r.category}</td>
                        <td className="sp1-skills-val">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        </section>
      )}

      {/* ══ EXPERIENCE ══════════════════════════════════════════════════════ */}
      {experience.length > 0 && (
        <section id="sp1-sec-exp" className="sp1-section">
          <div className="sp1-section-inner">
            <SectionTitle title="Experience" icon={<MdTimeline size={18} />} accent="var(--sp1-orange)" />
            <div className="sp1-exp-list">
              {experience.map((e, i) => (
                <div key={e?.id ?? i} className="sp1-exp-card" style={{ "--i": i }}>
                  <MacBar label={`${safe(e?.role) || "Role"} @ ${safe(e?.company) || "Company"}`} live={isCurrent(e)} />
                  <div className="sp1-exp-body">
                    <div className="sp1-exp-left">
                      <div className="sp1-exp-orb">
                        <div className="sp1-exp-orb-ring sp1-eor1" />
                        <div className="sp1-exp-orb-ring sp1-eor2" />
                        <div className="sp1-exp-orb-core">
                          {isCurrent(e) ? <MdFlashOn size={14} /> : <MdWork size={12} />}
                        </div>
                      </div>
                    </div>
                    <div className="sp1-exp-content">
                      <div className="sp1-exp-role-row">
                        <h3 className="sp1-exp-role">{safe(e?.role) || "Role"}</h3>
                        {isCurrent(e) && (
                          <span className="sp1-live-pill">
                            <span className="sp1-live-dot" />Active
                          </span>
                        )}
                      </div>
                      <div className="sp1-exp-company">
                        <MdBusiness size={12} />
                        <span>{safe(e?.company)}</span>
                      </div>
                      <div className="sp1-exp-dates">
                        <MdCalendarToday size={11} />
                        <span>
                          {safe(e?.start)}{safe(e?.end) ? ` – ${safe(e.end)}` : " – Present"}
                        </span>
                      </div>
                      {safe(e?.description) && (
                        <p className="sp1-exp-desc">{safe(e.description)}</p>
                      )}
                    </div>
                  </div>
                  <div className="sp1-exp-corner sp1-corner-tl" />
                  <div className="sp1-exp-corner sp1-corner-br" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ PROJECTS ════════════════════════════════════════════════════════ */}
      {projects.length > 0 && (
        <section id="sp1-sec-projects" className="sp1-section sp1-section-alt">
          <div className="sp1-section-inner">
            <SectionTitle title="Projects" icon={<FaLayerGroup size={15} />} accent="var(--sp1-violet)" />
            <div className="sp1-projects-grid">
              {projects.map((p, i) => (
                <ProjectCard key={p?.id ?? i} index={i + 1} p={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ ACHIEVEMENTS ════════════════════════════════════════════════════ */}
      {achievements.length > 0 && (
        <section id="sp1-sec-ach" className="sp1-section">
          <div className="sp1-section-inner">
            <SectionTitle title="Achievements" icon={<MdEmojiEvents size={18} />} accent="var(--sp1-gold)" />
            <div className="sp1-ach-grid">
              {achievements.map((a, i) => (
                <div key={a?.id ?? i} className="sp1-ach-card" style={{ "--i": i }}>
                  <div className="sp1-ach-top-bar">
                    <div className="sp1-ach-icon">
                      <MdStar size={18} />
                    </div>
                    {(safe(a?.date) || safe(a?.year)) && (
                      <span className="sp1-ach-year">{safe(a?.date) || safe(a?.year)}</span>
                    )}
                  </div>
                  <div className="sp1-ach-body">
                    <h4 className="sp1-ach-title">{safe(a?.title) || "Achievement"}</h4>
                    {safe(a?.issuer) && (
                      <div className="sp1-ach-issuer">
                        <span className="sp1-ach-beam" />
                        {safe(a.issuer)}
                      </div>
                    )}
                    {safe(a?.description) && (
                      <p className="sp1-ach-desc">{safe(a.description)}</p>
                    )}
                  </div>
                  {safe(a?.link) && (
                    <div className="sp1-ach-actions">
                      <a
                        href={safe(a.link)}
                        target="_blank" rel="noopener noreferrer"
                        className="sp1-ach-link"
                      >
                        <MdLink size={12} /> View
                      </a>
                    </div>
                  )}
                  <div className="sp1-ach-prism" />
                  <div className="sp1-ach-corner sp1-corner-tl" />
                  <div className="sp1-ach-corner sp1-corner-br" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ EDUCATION ══════════════════════════════════════════════════════ */}
      {education.length > 0 && (
        <section id="sp1-sec-edu" className="sp1-section sp1-section-alt">
          <div className="sp1-section-inner">
            <SectionTitle title="Education" icon={<MdSchool size={18} />} accent="var(--sp1-violet)" />
            <div className="sp1-edu-list">
              {education.map((e, i) => (
                <div key={e?.id ?? i} className="sp1-edu-card" style={{ "--i": i }}>
                  <div className="sp1-edu-num">0{i + 1}</div>
                  <div className="sp1-edu-body">
                    <MacBar label={`DEGREE_${String(i + 1).padStart(2, "0")}`} />
                    <div className="sp1-edu-content">
                      <h3 className="sp1-edu-degree">{safe(e?.degree) || "Degree"}</h3>
                      <div className="sp1-edu-inst">
                        <MdBusiness size={12} />
                        <span>{safe(e?.institution)}</span>
                      </div>
                      {safe(e?.year) && (
                        <span className="sp1-edu-year">
                          <MdCalendarToday size={11} /> {safe(e.year)}
                        </span>
                      )}
                      {safe(e?.details) && (
                        <p className="sp1-edu-details">{safe(e.details)}</p>
                      )}
                    </div>
                  </div>
                  <div className="sp1-edu-corner sp1-corner-tl" />
                  <div className="sp1-edu-corner sp1-corner-br" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ PROGRAMMING LANGUAGES ══════════════════════════════════════════ */}
      {languages.length > 0 && (
        <section id="sp1-sec-langs" className="sp1-section">
          <div className="sp1-section-inner">
            <SectionTitle title="Programming Languages" icon={<MdCode size={18} />} accent="var(--sp1-electric)" />
            <GlassCard sx={{ padding: "0" }}>
              <div className="sp1-langs-table-wrap">
                <table className="sp1-langs-table">
                  <thead>
                    <tr>
                      <th>Language</th>
                      <th>Level</th>
                      <th>Experience</th>
                    </tr>
                  </thead>
                  <tbody>
                    {languages.map((l, i) => (
                      <tr key={l?.id ?? i}>
                        <td className="sp1-lang-name-cell">{safe(l?.language) || "—"}</td>
                        <td className="sp1-lang-level-cell">{safe(l?.level) || "—"}</td>
                        <td className="sp1-lang-yr-cell">
                          {typeof l?.years === "number" ? `${l.years} yr` : safe(l?.years) || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        </section>
      )}

      {/* ══ CONTACT ══════════════════════════════════════════════════════════ */}
      <section id="sp1-sec-contact" className="sp1-section sp1-section-alt sp1-contact-section">
        <div className="sp1-section-inner">
          <SectionTitle title="Contact" icon={<MdEmail size={18} />} accent="var(--sp1-coral)" />
          <div className="sp1-contact-layout">

            {/* Left: headline */}
            <div className="sp1-contact-left">
              <div className="sp1-contact-big">
                Ready to<br /><em>collaborate?</em>
              </div>
              <p className="sp1-contact-sub">
                Reach out through any channel. I respond within 24 hours.
              </p>
              <div className="sp1-contact-deco" />
            </div>

            {/* Right: channel cards */}
            <div className="sp1-contact-channels">
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="sp1-channel sp1-ch-email">
                  <div className="sp1-ch-icon"><MdEmail size={20} /></div>
                  <div className="sp1-ch-body">
                    <span className="sp1-ch-label">Email</span>
                    <span className="sp1-ch-val">{contactEmail}</span>
                  </div>
                  <MdArrowOutward size={14} className="sp1-ch-arrow" />
                </a>
              )}
              {safe(socials?.phone) && (
                <a href={`tel:${safe(socials.phone)}`} className="sp1-channel sp1-ch-phone">
                  <div className="sp1-ch-icon"><MdPhone size={20} /></div>
                  <div className="sp1-ch-body">
                    <span className="sp1-ch-label">Phone</span>
                    <span className="sp1-ch-val">{safe(socials.phone)}</span>
                  </div>
                  <MdArrowOutward size={14} className="sp1-ch-arrow" />
                </a>
              )}
              {safe(socials?.github) && (
                <a href={safe(socials.github)} target="_blank" rel="noopener noreferrer" className="sp1-channel sp1-ch-gh">
                  <div className="sp1-ch-icon"><FaGithub size={18} /></div>
                  <div className="sp1-ch-body">
                    <span className="sp1-ch-label">GitHub</span>
                    <span className="sp1-ch-val">View Profile</span>
                  </div>
                  <MdArrowOutward size={14} className="sp1-ch-arrow" />
                </a>
              )}
              {safe(socials?.linkedin) && (
                <a href={safe(socials.linkedin)} target="_blank" rel="noopener noreferrer" className="sp1-channel sp1-ch-li">
                  <div className="sp1-ch-icon"><FaLinkedin size={18} /></div>
                  <div className="sp1-ch-body">
                    <span className="sp1-ch-label">LinkedIn</span>
                    <span className="sp1-ch-val">Connect</span>
                  </div>
                  <MdArrowOutward size={14} className="sp1-ch-arrow" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="sp1-footer">
        <div className="sp1-footer-inner">
          <span>Crafted by <strong>{name}</strong></span>
          <span className="sp1-footer-badge">
            <MdWorkspacePremium size={11} /> SOLARIS PREMIUM
          </span>
        </div>
      </footer>

      {/* ══ RESUME PREVIEW DIALOG ══════════════════════════════════════════ */}
<ResumePreviewDialog
  open={resumePreviewOpen}
  title={resumePreviewTitle}
  onClose={closeResumePreview}
  url={viewResumeUrl(username)}
  blobUrl={resumePreviewBlobUrl}
  loading={resumePreviewLoading}
/>
    </div>
  );
}