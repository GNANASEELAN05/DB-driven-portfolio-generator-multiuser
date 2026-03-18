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
  MdHub, MdFlashOn, MdArrowOutward, MdMenu, MdKeyboardArrowDown,MdTerminal,
  MdAutoAwesome, MdRefresh, MdVisibility, MdTimeline,
  MdSettings,
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


// ── Devicon slug resolver (same logic as SkillsBucket.jsx) ────────────────────
function sp1ToDeviconSlug(name) {
  const raw = String(name || "").trim().toLowerCase();
  const overrides = {
    "html": "html5", "html5": "html5",
    "css": "css3", "css3": "css3",
    "js": "javascript", "javascript": "javascript",
    "javascript (js)": "javascript",
    "node": "nodejs", "node.js": "nodejs", "nodejs": "nodejs",
    "react": "react", "react.js": "react", "reactjs": "react",
    "next.js": "nextjs", "nextjs": "nextjs",
    "vue": "vuejs", "vue.js": "vuejs", "vuejs": "vuejs",
    "tailwind": "tailwindcss", "tailwindcss": "tailwindcss",
    "tailwind css": "tailwindcss",
    "express": "express", "express.js": "express",
    "postgres": "postgresql", "postgresql": "postgresql",
    "mysql": "mysql", "sql": "mysql",
    "mongodb": "mongodb",
    "firebase": "firebase",
    "c++": "cplusplus", "c#": "csharp",
    "c": "c",
    "java": "java",
    "python": "python",
    "typescript": "typescript", "ts": "typescript",
    "android studio": "androidstudio",
    "vs code": "vscode", "vscode": "vscode", "vs": "vscode",
    "visual studio code": "vscode",
    "git": "git", "github": "github",
    "docker": "docker",
    "aws": "amazonwebservices",
    "google cloud": "googlecloud", "gcp": "googlecloud",
    "spring boot": "spring", "springboot": "spring",
    "spring": "spring",
    "three.js": "threejs", "threejs": "threejs",
    "nuxt.js": "nuxtjs", "nuxt": "nuxtjs",
    "angular": "angular",
    "flutter": "flutter", "dart": "dart",
    "kotlin": "kotlin", "swift": "swift",
    "rust": "rust", "go": "go", "golang": "go",
    "php": "php", "laravel": "laravel",
    "redis": "redis",
    "graphql": "graphql",
    "figma": "figma",
    "postman": "postman",
    "linux": "linux",
    "bootstrap": "bootstrap",
    "sass": "sass", "scss": "sass",
    "webpack": "webpack", "vite": "vitejs",
    "jest": "jest",
    "kubernetes": "kubernetes", "k8s": "kubernetes",
    "nginx": "nginx",
    "netlify": "netlify", "vercel": "vercel",
    "heroku": "heroku",
    "nosql": null, "no sql": null,
    "sql server": "microsoftsqlserver",
    "sqlite": "sqlite",
    "redux": "redux",
    "svelte": "svelte",
    "astro": "astro",
    "nestjs": "nestjs", "nest.js": "nestjs",
    "fastapi": "fastapi",
    "django": "django",
    "flask": "flask",
    "rails": "rails", "ruby on rails": "rails",
    "ruby": "ruby",
    "scala": "scala",
    "terraform": "terraform",
    "ansible": "ansible",
    "jenkins": "jenkins",
    "gitlab": "gitlab",
    "bitbucket": "bitbucket",
    "jira": "jira",
    "confluence": "confluence",
    "remix": "remix",
    "gatsby": "gatsby",
  };
  if (raw in overrides) return overrides[raw];
  return raw
    .replace(/\.js$/i, "js")
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function sp1ResolveLogoUrls(name) {
  const slug = sp1ToDeviconSlug(name);
  if (!slug) return [];
  return [
    `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`,
    `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-plain.svg`,
    `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original-wordmark.svg`,
    `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-plain-wordmark.svg`,
  ];
}

// ── Skill logo card with multi-URL fallback (mirrors SkillsBucket.jsx) ────────
function Sp1SkillLogoCard({ chip, ci, rowIdx, accent }) {
  const urls = sp1ResolveLogoUrls(chip);
  const [urlIdx, setUrlIdx] = useState(0);
  const initials = String(chip || "").slice(0, 2).toUpperCase();
  const currentUrl = urls[urlIdx] || null;

  return (
    <div
      className="sp1-skf-logo-card"
      style={{ animationDelay: `${rowIdx * 0.12 + ci * 0.055}s` }}
    >
      <div className="sp1-skf-logo-inner">
        <div
          className="sp1-skf-logo-glow-ring"
          style={{ background: `linear-gradient(135deg, ${accent}, transparent, transparent)` }}
        />
        <div className="sp1-skf-logo-icon-wrap">
          {currentUrl ? (
            <img
              key={currentUrl}
              src={currentUrl}
              alt={chip}
              className="sp1-skf-logo-img"
              onError={() => setUrlIdx(p => p + 1)}
              loading="lazy"
            />
          ) : (
            <div className="sp1-skf-logo-fallback">{initials}</div>
          )}
        </div>
        <span className="sp1-skf-logo-name">{chip}</span>
        <span
          className="sp1-skf-logo-dot"
          style={{ background: accent, boxShadow: `0 0 5px ${accent}` }}
        />
      </div>
    </div>
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
                onClick={() => navigate(`/${username}/adminpanel/premium1`)}
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
    <MacBar label={`${(name || "portfolio").toUpperCase().replace(/\s+/g, "_")}`} live />

    {/* Holographic grid floor */}
    <div className="sp1-hero-holo-floor">
      <div className="sp1-holo-lines-h" />
      <div className="sp1-holo-lines-v" />
      <div className="sp1-holo-center-glow" />
    </div>

    {/* Floating particle dots */}
    {[...Array(12)].map((_, i) => (
      <div key={i} className="sp1-hero-particle" style={{ "--pi": i }} />
    ))}

    <div className="sp1-hero-inner">

      {/* ── LEFT column: avatar + rings ── */}
      <div className="sp1-hero-avatar-col">
        <div className="sp1-hero-orbital-wrap">
          {/* Outer data rings */}
          <div className="sp1-hor sp1-hor1" />
          <div className="sp1-hor sp1-hor2" />
          <div className="sp1-hor sp1-hor3" />
          <div className="sp1-hor sp1-hor4" />

          {/* Orbiting dots */}
          <div className="sp1-hod sp1-hod1"><span /></div>
          <div className="sp1-hod sp1-hod2"><span /></div>
          <div className="sp1-hod sp1-hod3"><span /></div>
          <div className="sp1-hod sp1-hod4"><span /></div>

          {/* Avatar core */}
          <div className="sp1-hero-avatar-core">
            <div className="sp1-hav-shimmer" />
            <div className="sp1-hav-initials">
              {safe(profile?.initials) ||
                (name || username || "").slice(0, 2).toUpperCase()}
            </div>
            <div className="sp1-hav-scanline" />
          </div>

          {/* Status badge */}
          <div className="sp1-hero-status">
            <span className="sp1-status-pulse" />
            Available for work
          </div>

          {/* HUD corner labels */}
          <div className="sp1-hud-label sp1-hud-tl">SYS://LIVE</div>
          <div className="sp1-hud-label sp1-hud-tr">v2.0</div>
          <div className="sp1-hud-label sp1-hud-bl">READY</div>
          <div className="sp1-hud-label sp1-hud-br">∞</div>
        </div>
      </div>

      {/* ── CENTER column: identity ── */}
      <div className="sp1-hero-identity">

        {/* Eyebrow */}
        <div className="sp1-hero-eyebrow">
          <span className="sp1-eyebrow-dot" />
          {titleText}
          <span className="sp1-eyebrow-tail" />
        </div>

        {/* Name */}
        <h1 className="sp1-hero-name">
          {(name).split(" ").map((word, i) => (
            <span key={i} className="sp1-name-word" style={{ "--d": `${i * 0.12}s` }}>
              {i === 0 ? word : <span className="sp1-name-accent">{word}</span>}
            </span>
          ))}
        </h1>

        {/* Glitch underline beam */}
        <div className="sp1-hero-beam-line">
          <div className="sp1-beam-core" />
          <div className="sp1-beam-glow" />
        </div>

        {tagline && <p className="sp1-hero-tagline">{tagline}</p>}

        {/* Meta row */}
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

        {/* CTA row */}
        <div className="sp1-hero-cta">
          <button className="sp1-cta-primary" onClick={() => scrollTo("about")}>
            Explore <MdKeyboardArrowDown size={15} />
          </button>
          <button className="sp1-cta-secondary" onClick={onDownloadResume} disabled={downloading}>
            <MdDownload size={15} />
            {downloading ? "Downloading…" : `Download CV`}
          </button>
          <button type="button" className="sp1-cta-ghost" onClick={onPreviewResume}>
            <MdVisibility size={15} /> Preview
          </button>
        </div>

        {/* Socials */}
        <div className="sp1-hero-socials">
          {safe(socials?.github) && (
            <a href={safe(socials.github)} target="_blank" rel="noopener noreferrer"
              className="sp1-social-btn" title="GitHub"><FaGithub size={16} /></a>
          )}
          {safe(socials?.linkedin) && (
            <a href={safe(socials.linkedin)} target="_blank" rel="noopener noreferrer"
              className="sp1-social-btn" title="LinkedIn"><FaLinkedin size={16} /></a>
          )}
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className="sp1-social-btn" title="Email">
              <MdEmail size={16} /></a>
          )}
          {safe(socials?.website) && (
            <a href={safe(socials.website)} target="_blank" rel="noopener noreferrer"
              className="sp1-social-btn" title="Website"><FaGlobe size={15} /></a>
          )}
          {safe(socials?.phone) && (
            <a href={`tel:${safe(socials.phone)}`} className="sp1-social-btn" title="Phone">
              <MdPhone size={15} /></a>
          )}
        </div>
      </div>

      {/* ── RIGHT column: terminal data panel ── */}
      <div className="sp1-hero-data-panel">
        <div className="sp1-dp-bar">
          <div className="sp1-dp-bar-dots">
            <span /><span /><span />
          </div>
          <span className="sp1-dp-live">LIVE</span>
        </div>

<div className="sp1-dp-body">

          {/* Skill stream */}
          <div className="sp1-dp-block">
            <div className="sp1-dp-skill-rows">
              {[
                ...parseList(skills.frontend).slice(0, 3).map(s => ({ s, type: "fe" })),
                ...parseList(skills.backend).slice(0, 2).map(s => ({ s, type: "be" })),
                ...parseList(skills.tools).slice(0, 2).map(s => ({ s, type: "tool" })),
              ].length > 0
                ? [
                    ...parseList(skills.frontend).slice(0, 3).map(s => ({ s, type: "fe" })),
                    ...parseList(skills.backend).slice(0, 2).map(s => ({ s, type: "be" })),
                    ...parseList(skills.tools).slice(0, 2).map(s => ({ s, type: "tool" })),
                  ].map(({ s, type }, i) => (
                    <div key={i} className={`sp1-dp-skill-row sp1-dp-skill-${type}`}
                      style={{ "--sri": i }}>
                      <span className="sp1-dp-skill-dot" />
                      <span className="sp1-dp-skill-name">{s}</span>
                      <span className="sp1-dp-skill-bar">
                        <span className="sp1-dp-skill-fill" style={{
                          "--fill-w": `${72 + Math.sin(i * 1.4) * 22}%`
                        }} />
                      </span>
                    </div>
                  ))
                : ["React", "Node.js", "Python", "MongoDB", "Docker"].map((s, i) => (
                    <div key={i} className={`sp1-dp-skill-row sp1-dp-skill-${["fe","fe","be","be","tool"][i]}`}
                      style={{ "--sri": i }}>
                      <span className="sp1-dp-skill-dot" />
                      <span className="sp1-dp-skill-name">{s}</span>
                      <span className="sp1-dp-skill-bar">
                        <span className="sp1-dp-skill-fill" style={{ "--fill-w": `${90 - i * 8}%` }} />
                      </span>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Divider */}
          <div className="sp1-dp-divider" />

          {/* System status block */}
          <div className="sp1-dp-block">
            <div className="sp1-dp-status-rows">
              {[
                { key: "uptime",   val: "99.9%",   c: "var(--sp1-lime)" },
                { key: "mode",     val: "BUILD",    c: "var(--sp1-electric)" },
                { key: "focus",    val: "FRONTEND", c: "var(--sp1-coral)" },
                { key: "commits",  val: "∞",        c: "var(--sp1-gold)" },
              ].map(({ key, val, c }, i) => (
                <div key={i} className="sp1-dp-status-row" style={{ "--sri": i }}>
                  <span className="sp1-dp-status-key">{key}</span>
                  <span className="sp1-dp-status-sep">·····</span>
                  <span className="sp1-dp-status-val" style={{ color: c }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="sp1-dp-divider" />

          {/* Activity bar */}
          <div className="sp1-dp-block">
            <div className="sp1-dp-activity">
              {[...Array(28)].map((_, i) => (
                <div key={i} className="sp1-dp-act-bar"
                  style={{
                    "--ah": `${20 + Math.abs(Math.sin(i * 0.7)) * 80}%`,
                    "--ac2": i % 3 === 0
                      ? "var(--sp1-coral)"
                      : i % 3 === 1
                        ? "var(--sp1-electric)"
                        : "var(--sp1-violet)",
                    "--adi": i,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Scan line */}
          <div className="sp1-dp-scanbeam" />
        </div>

        {/* Corner accents */}
        <span className="sp1-dpc sp1-dpc-tl" />
        <span className="sp1-dpc sp1-dpc-tr" />
        <span className="sp1-dpc sp1-dpc-bl" />
        <span className="sp1-dpc sp1-dpc-br" />
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

      <div className="sp1-about-holo-wrap">

        {/* Left: Avatar / Identity Card */}
        <div className="sp1-about-id-card">
          <div className="sp1-id-ring">
            <div className="sp1-id-ring-inner">
              <div className="sp1-id-avatar-glow" />
              <MdPerson size={52} className="sp1-id-icon" />
            </div>
            <svg className="sp1-id-ring-svg" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" className="sp1-ring-track" />
              <circle cx="60" cy="60" r="54" className="sp1-ring-progress" />
            </svg>
          </div>

          <div className="sp1-id-label">
            <span className="sp1-id-name">{profile?.name || "Developer"}</span>
            <span className="sp1-id-role">{profile?.title || "Frontend Engineer"}</span>
          </div>

          <div className="sp1-id-stats">
            {[
              { label: "STATUS", value: "ONLINE" },
              { label: "MODE", value: "BUILD" },
              { label: "STACK", value: "REACT" },
            ].map(({ label, value }) => (
              <div className="sp1-id-stat" key={label}>
                <span className="sp1-stat-label">{label}</span>
                <span className="sp1-stat-value">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Bio Terminal */}
        <div className="sp1-about-terminal">
          <div className="sp1-terminal-bar">
            <div className="sp1-term-dots">
              <span /><span /><span />
            </div>
            <span className="sp1-term-title">bio.sys — decrypting…</span>
            <span className="sp1-term-badge">LIVE</span>
          </div>

          <div className="sp1-terminal-body">

            <div className="sp1-scan-beam" />

            <p className="sp1-about-bio">{about}</p>

            <div className="sp1-term-footer">
              <span className="sp1-footer-line">

              </span>
              <span className="sp1-blink-cursor">▋</span>
            </div>
          </div>

          {/* Corner accents */}
          <span className="sp1-corner sp1-tl" />
          <span className="sp1-corner sp1-tr" />
          <span className="sp1-corner sp1-bl" />
          <span className="sp1-corner sp1-br" />
        </div>

      </div>
    </div>
  </section>
)}

{/* ══ SKILLS ══════════════════════════════════════════════════════════ */}
{(parseList(skills.frontend).length > 0 ||
  parseList(skills.backend).length > 0 ||
  parseList(skills.database).length > 0 ||
  parseList(skills.tools).length > 0) && (
  <section id="sp1-sec-skills" className="sp1-section sp1-section-alt">
    <div className="sp1-section-inner">
      <SectionTitle title="Skills" icon={<MdCode size={18} />} accent="var(--sp1-electric)" />

      <div className="sp1-skt-timeline">
        <div className="sp1-skt-spine" />

        {skillCategoryRows.filter(r => r.value !== "—").map((row, rowIdx) => {
          const chips = row.value.split(" · ").map(s => s.trim()).filter(Boolean);
          const isEven = rowIdx % 2 === 0;

          const accentCycle = [
            { color: "var(--sp1-electric)", glow: "rgba(6,182,212,0.30)",   bg: "rgba(6,182,212,0.10)",   border: "rgba(6,182,212,0.38)"  },
            { color: "var(--sp1-coral)",    glow: "rgba(241,48,36,0.28)",   bg: "rgba(241,48,36,0.09)",   border: "rgba(241,48,36,0.36)"  },
            { color: "var(--sp1-violet)",   glow: "rgba(168,85,247,0.26)",  bg: "rgba(168,85,247,0.08)",  border: "rgba(168,85,247,0.34)" },
            { color: "var(--sp1-lime)",     glow: "rgba(16,185,129,0.26)",  bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.34)" },
          ];
          const ac = accentCycle[rowIdx % accentCycle.length];

          const catIcons = [<MdCode size={16} />, <MdTerminal size={16} />, <FaLayerGroup size={14} />, <MdSettings size={16} />];
          const catIcon = catIcons[rowIdx % catIcons.length];

          return (
            <div
              key={rowIdx}
              className={`sp1-skt-item${isEven ? " sp1-skt-left" : " sp1-skt-right"}`}
              style={{
                "--i": rowIdx,
                "--sk-color":  ac.color,
                "--sk-glow":   ac.glow,
                "--sk-bg":     ac.bg,
                "--sk-border": ac.border,
              }}
            >
              {/* Timeline node */}
              <div className="sp1-skt-node">
                <div className="sp1-skt-node-ring sp1-sknr1" />
                <div className="sp1-skt-node-ring sp1-sknr2" />
                <div className="sp1-skt-node-core">{catIcon}</div>
              </div>

              {/* Card */}
              <div className="sp1-skt-card">
                <div className="sp1-skt-prism" />
                <div className="sp1-skt-corner sp1-corner-tl" />
                <div className="sp1-skt-corner sp1-corner-br" />

                {/* Top bar */}
                <div className="sp1-skt-card-bar">
                  <div className="sp1-skt-bar-dots">
                    <span className="sp1-dot sp1-dot-red" />
                    <span className="sp1-dot sp1-dot-yellow" />
                    <span className="sp1-dot sp1-dot-green" />
                  </div>
                  <span className="sp1-skt-bar-label">
                    {`SKILL_CAT_${String(rowIdx + 1).padStart(2, "0")}`}
                  </span>
                  <span className="sp1-skt-count-chip">
                    {String(chips.length).padStart(2, "0")} tools
                  </span>
                </div>

                {/* Card body */}
                <div className="sp1-skt-card-body">

                  {/* Category header */}
                  <div className="sp1-skt-header-row">
                    <div className="sp1-skt-medal-wrap">
                      <div className="sp1-skt-medal-ring sp1-smtr1" />
                      <div className="sp1-skt-medal-ring sp1-smtr2" />
                      <div className="sp1-skt-medal-core">{catIcon}</div>
                    </div>
                    <div className="sp1-skt-title-block">
                      <h4 className="sp1-skt-cat-title">{row.category}</h4>
                      <div className="sp1-skt-cat-sub-row">
                        <span className="sp1-skt-cat-sub-dot" />
                        <span className="sp1-skt-cat-sub">{chips.length} technologies</span>
                      </div>
                    </div>
                  </div>

                  <div className="sp1-skt-divider" />

                  {/* Logo cards grid */}
                  <div className="sp1-skt-logo-grid">
                    {chips.map((chip, ci) => (
                      <Sp1SkillLogoCard
                        key={ci}
                        chip={chip}
                        ci={ci}
                        rowIdx={rowIdx}
                        accent={ac.color}
                      />
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="sp1-skt-card-footer">
                    <div className="sp1-skt-index-badge">
                      <span className="sp1-skt-index-hash">#</span>
                      <span className="sp1-skt-index-num">{String(rowIdx + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="sp1-skt-footer-tag">
                      <span className="sp1-skt-footer-dot" />
                      {row.category} Stack
                    </div>
                    <div className="sp1-skt-scan-dots">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
)}

{/* ══ EXPERIENCE ══════════════════════════════════════════════════════ */}
      {experience.length > 0 && (
        <section id="sp1-sec-exp" className="sp1-section">
          <div className="sp1-section-inner">
            <SectionTitle title="Experience" icon={<MdTimeline size={18} />} accent="var(--sp1-orange)" />

            <div className="sp1-exp-timeline">
              <div className="sp1-exp-spine" />

              {experience.map((e, i) => {
                const isEven = i % 2 === 0;
                const expColors = [
                  { color: "var(--sp1-coral)",    glow: "rgba(241,48,36,0.30)",   bg: "rgba(241,48,36,0.10)",   border: "rgba(241,48,36,0.38)"  },
                  { color: "var(--sp1-orange)",   glow: "rgba(249,115,22,0.28)",  bg: "rgba(249,115,22,0.09)",  border: "rgba(249,115,22,0.36)" },
                  { color: "var(--sp1-electric)", glow: "rgba(6,182,212,0.26)",   bg: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.34)"  },
                  { color: "var(--sp1-lime)",     glow: "rgba(16,185,129,0.26)",  bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.34)" },
                  { color: "var(--sp1-violet)",   glow: "rgba(168,85,247,0.26)",  bg: "rgba(168,85,247,0.08)",  border: "rgba(168,85,247,0.34)" },
                  { color: "var(--sp1-gold)",     glow: "rgba(251,191,36,0.26)",  bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.34)" },
                ];
                const ec = expColors[i % expColors.length];
                const current = isCurrent(e);

                return (
                  <div
                    key={e?.id ?? i}
                    className={`sp1-exp-item${isEven ? " sp1-exp-left" : " sp1-exp-right"}`}
                    style={{
                      "--i": i,
                      "--ec-color":  ec.color,
                      "--ec-glow":   ec.glow,
                      "--ec-bg":     ec.bg,
                      "--ec-border": ec.border,
                    }}
                  >
                    {/* Timeline node */}
                    <div className="sp1-exp-node">
                      <div className="sp1-exp-node-ring sp1-exnr1" />
                      <div className="sp1-exp-node-ring sp1-exnr2" />
                      <div className="sp1-exp-node-core">
                        {current ? <MdFlashOn size={15} /> : <MdWork size={13} />}
                      </div>
                      {current && <div className="sp1-exp-node-pulse" />}
                    </div>

                    {/* Card */}
                    <div className="sp1-exp-card">
                      <div className="sp1-exp-prism" />
                      <div className="sp1-exp-corner sp1-corner-tl" />
                      <div className="sp1-exp-corner sp1-corner-br" />

                      {/* Top bar */}
                      <div className="sp1-exp-card-bar">
                        <div className="sp1-exp-bar-dots">
                          <span className="sp1-dot sp1-dot-red" />
                          <span className="sp1-dot sp1-dot-yellow" />
                          <span className="sp1-dot sp1-dot-green" />
                        </div>
                        <span className="sp1-exp-bar-label">
                          {`${safe(e?.role) || "role"} @ ${safe(e?.company) || "company"}`}
                        </span>
                        {current && (
                          <span className="sp1-live-pill">
                            <span className="sp1-live-dot" />
                            ACTIVE
                          </span>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="sp1-exp-card-body">

                        {/* Role + company row */}
                        <div className="sp1-exp-role-block">
                          <div className="sp1-exp-role-beam" />
                          <div className="sp1-exp-role-text">
                            <h3 className="sp1-exp-role">{safe(e?.role) || "Role"}</h3>
                            <div className="sp1-exp-company-row">
                              <div className="sp1-exp-company-icon">
                                <MdBusiness size={12} />
                              </div>
                              <span className="sp1-exp-company-name">{safe(e?.company)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="sp1-exp-dates-chip">
                          <MdCalendarToday size={10} />
                          <span>
                            {safe(e?.start)}{safe(e?.end) ? ` — ${safe(e.end)}` : " — Present"}
                          </span>
                        </div>

                        {/* Divider */}
                        <div className="sp1-exp-card-divider" />

                        {/* Description */}
                        {safe(e?.description) && (
                          <p className="sp1-exp-desc">{safe(e.description)}</p>
                        )}

                        {/* Footer */}
                        <div className="sp1-exp-card-footer">
                          <div className="sp1-exp-index-badge">
                            <span className="sp1-exp-index-hash">#</span>
                            <span className="sp1-exp-index-num">{String(i + 1).padStart(2, "0")}</span>
                          </div>
                          <div className="sp1-exp-footer-tag">
                            <span className="sp1-exp-footer-dot" />
                            {current ? "Current Role" : "Past Role"}
                          </div>
                          <div className="sp1-exp-scan-dots">
                            <span /><span /><span />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
        <section id="sp1-sec-ach" className="sp1-section sp1-section-alt">
          <div className="sp1-section-inner">
            <SectionTitle title="Achievements" icon={<MdEmojiEvents size={18} />} accent="var(--sp1-gold)" />

            <div className="sp1-ach-timeline">
              <div className="sp1-ach-spine" />

              {achievements.map((a, i) => {
                const isEven = i % 2 === 0;
                const accentCycle = [
                  { color: "var(--sp1-gold)",     glow: "rgba(251,191,36,0.30)",  bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.38)" },
                  { color: "var(--sp1-coral)",    glow: "rgba(241,48,36,0.28)",   bg: "rgba(241,48,36,0.09)",   border: "rgba(241,48,36,0.36)"  },
                  { color: "var(--sp1-electric)", glow: "rgba(6,182,212,0.26)",   bg: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.34)"  },
                  { color: "var(--sp1-violet)",   glow: "rgba(168,85,247,0.26)",  bg: "rgba(168,85,247,0.08)",  border: "rgba(168,85,247,0.34)" },
                  { color: "var(--sp1-lime)",     glow: "rgba(16,185,129,0.26)",  bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.34)" },
                  { color: "var(--sp1-orange)",   glow: "rgba(249,115,22,0.26)",  bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.34)" },
                ];
                const ac = accentCycle[i % accentCycle.length];
                const rankLabels = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];

                return (
                  <div
                    key={a?.id ?? i}
                    className={`sp1-acht-item${isEven ? " sp1-acht-left" : " sp1-acht-right"}`}
                    style={{
                      "--i": i,
                      "--ac-color":  ac.color,
                      "--ac-glow":   ac.glow,
                      "--ac-bg":     ac.bg,
                      "--ac-border": ac.border,
                    }}
                  >
                    {/* Timeline node */}
                    <div className="sp1-acht-node">
                      <div className="sp1-acht-node-ring sp1-atnr1" />
                      <div className="sp1-acht-node-ring sp1-atnr2" />
                      <div className="sp1-acht-node-core">
                        <MdStar size={16} />
                      </div>
                    </div>

                    {/* Card */}
                    <div className="sp1-acht-card">
                      <div className="sp1-acht-prism" />
                      <div className="sp1-acht-corner sp1-corner-tl" />
                      <div className="sp1-acht-corner sp1-corner-br" />

                      {/* Rank watermark */}
                      <span className="sp1-acht-rank-watermark">
                        {rankLabels[i] ?? i + 1}
                      </span>

                      {/* Top bar */}
                      <div className="sp1-acht-card-bar">
                        <div className="sp1-acht-bar-dots">
                          <span className="sp1-dot sp1-dot-red" />
                          <span className="sp1-dot sp1-dot-yellow" />
                          <span className="sp1-dot sp1-dot-green" />
                        </div>
                        <span className="sp1-acht-bar-label">
                          {`AWARD_${String(i + 1).padStart(2, "0")}`}
                        </span>
                        {(safe(a?.date) || safe(a?.year)) && (
                          <div className="sp1-acht-date-chip">
                            <MdCalendarToday size={9} />
                            <span>{safe(a?.date) || safe(a?.year)}</span>
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="sp1-acht-card-body">

                        {/* Medal + title row */}
                        <div className="sp1-acht-header-row">
                          <div className="sp1-acht-medal-wrap">
                            <div className="sp1-acht-medal-ring sp1-amtr1" />
                            <div className="sp1-acht-medal-ring sp1-amtr2" />
                            <div className="sp1-acht-medal-core">
                              <MdEmojiEvents size={18} />
                            </div>
                          </div>
                          <div className="sp1-acht-title-block">
                            <h4 className="sp1-acht-title">
                              {safe(a?.title) || "Achievement"}
                            </h4>
                            {safe(a?.issuer) && (
                              <div className="sp1-acht-issuer-row">
                                <span className="sp1-acht-issuer-dot" />
                                <span className="sp1-acht-issuer-name">
                                  {safe(a.issuer)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="sp1-acht-divider" />

                        {/* Description */}
                        {safe(a?.description) && (
                          <p className="sp1-acht-desc">{safe(a.description)}</p>
                        )}

                        {/* Footer */}
                        <div className="sp1-acht-card-footer">
                          <div className="sp1-acht-index-badge">
                            <span className="sp1-acht-index-hash">#</span>
                            <span className="sp1-acht-index-num">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                          </div>
                          {safe(a?.link) && (
                            <a
                              href={safe(a.link)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sp1-acht-view-btn"
                            >
                              <span>View Certificate</span>
                              <MdLink size={12} />
                              <span className="sp1-acht-btn-glow" />
                            </a>
                          )}
                          <div className="sp1-acht-scan-dots">
                            <span /><span /><span />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

{/* ══ EDUCATION ══════════════════════════════════════════════════════ */}
      {education.length > 0 && (
        <section id="sp1-sec-edu" className="sp1-section sp1-section-alt">
          <div className="sp1-section-inner">
            <SectionTitle title="Education" icon={<MdSchool size={18} />} accent="var(--sp1-violet)" />

            {/* Timeline spine */}
            <div className="sp1-edu-timeline">
              <div className="sp1-edu-spine" />

              {education.map((e, i) => {
                const isEven = i % 2 === 0;
                const degreeColors = [
                  { color: "var(--sp1-violet)", glow: "rgba(168,85,247,0.30)", bg: "rgba(168,85,247,0.10)", border: "rgba(168,85,247,0.38)" },
                  { color: "var(--sp1-electric)", glow: "rgba(6,182,212,0.28)", bg: "rgba(6,182,212,0.09)", border: "rgba(6,182,212,0.36)" },
                  { color: "var(--sp1-lime)",    glow: "rgba(16,185,129,0.26)", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.34)" },
                  { color: "var(--sp1-gold)",    glow: "rgba(251,191,36,0.26)", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.34)" },
                ];
                const dc = degreeColors[i % degreeColors.length];

                return (
                  <div
                    key={e?.id ?? i}
                    className={`sp1-edu-item${isEven ? " sp1-edu-left" : " sp1-edu-right"}`}
                    style={{
                      "--i": i,
                      "--dc-color":  dc.color,
                      "--dc-glow":   dc.glow,
                      "--dc-bg":     dc.bg,
                      "--dc-border": dc.border,
                    }}
                  >
                    {/* Timeline node */}
                    <div className="sp1-edu-node">
                      <div className="sp1-edu-node-ring sp1-enr1" />
                      <div className="sp1-edu-node-ring sp1-enr2" />
                      <div className="sp1-edu-node-core">
                        <MdSchool size={14} />
                      </div>
                    </div>

                    {/* Card */}
                    <div className="sp1-edu-card">
                      <div className="sp1-edu-prism" />
                      <div className="sp1-edu-corner sp1-corner-tl" />
                      <div className="sp1-edu-corner sp1-corner-br" />

                      {/* Card top bar */}
                      <div className="sp1-edu-card-bar">
                        <div className="sp1-edu-index-orb">
                          <span>{String(i + 1).padStart(2, "0")}</span>
                        </div>
                        <div className="sp1-edu-bar-dots">
                          <span className="sp1-dot sp1-dot-red" />
                          <span className="sp1-dot sp1-dot-yellow" />
                          <span className="sp1-dot sp1-dot-green" />
                        </div>
                        <span className="sp1-edu-bar-label">
                          {`DEGREE_${String(i + 1).padStart(2, "0")}`}
                        </span>
                        {safe(e?.year) && (
                          <div className="sp1-edu-year-chip">
                            <MdCalendarToday size={9} />
                            <span>{safe(e.year)}</span>
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="sp1-edu-card-body">
                        {/* Degree title */}
                        <h3 className="sp1-edu-degree">{safe(e?.degree) || "Degree"}</h3>

                        {/* Institution row */}
                        {safe(e?.institution) && (
                          <div className="sp1-edu-inst-row">
                            <div className="sp1-edu-inst-icon">
                              <MdBusiness size={13} />
                            </div>
                            <span className="sp1-edu-inst-name">{safe(e.institution)}</span>
                          </div>
                        )}

                        {/* Divider */}
                        <div className="sp1-edu-card-divider" />

                        {/* Details */}
                        {safe(e?.details) && (
                          <p className="sp1-edu-details">{safe(e.details)}</p>
                        )}

                        {/* Footer scan line */}
                        <div className="sp1-edu-card-footer">
                          <span className="sp1-edu-footer-tag">
                            <span className="sp1-edu-footer-dot" />
                            Academic Record
                          </span>
                          <div className="sp1-edu-scan-dots">
                            <span /><span /><span />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
        <div className="sp1-langs-header-bar">
          <div className="sp1-langs-mac-dots">
            <span className="sp1-dot sp1-dot-red" />
            <span className="sp1-dot sp1-dot-yellow" />
            <span className="sp1-dot sp1-dot-green" />
          </div>
          <span className="sp1-langs-terminal-label">languages.config.ts</span>
          <span className="sp1-langs-count-badge">{languages.length} languages</span>
        </div>
        <div className="sp1-langs-grid">
          {languages.map((l, i) => {
            const levelMap = { beginner: 25, elementary: 40, intermediate: 60, "upper-intermediate": 72, advanced: 85, expert: 95, master: 100 };
            const levelKey = (safe(l?.level) || "").toLowerCase().replace(/\s+/g, "-");
            const barPct = levelMap[levelKey] ?? 65;
            const accentColors = [
              "var(--sp1-coral)", "var(--sp1-electric)", "var(--sp1-gold)",
              "var(--sp1-violet)", "var(--sp1-lime)", "var(--sp1-orange)",
            ];
            const accent = accentColors[i % accentColors.length];
            return (
              <div className="sp1-lang-row" key={l?.id ?? i} style={{ "--lang-accent": accent, "--bar-pct": `${barPct}%`, "--lang-i": i }}>
                <div className="sp1-lang-left">
                  <div className="sp1-lang-hex-wrap">
                    <div className="sp1-lang-hex">
                      <span className="sp1-lang-initial">{(safe(l?.language) || "?")[0].toUpperCase()}</span>
                    </div>
                    <div className="sp1-lang-hex-ring" />
                  </div>
                  <div className="sp1-lang-info">
                    <span className="sp1-lang-name">{safe(l?.language) || "—"}</span>
                    <span className="sp1-lang-level-tag">{safe(l?.level) || "—"}</span>
                  </div>
                </div>
                <div className="sp1-lang-bar-col">
                  <div className="sp1-lang-bar-track">
                    <div className="sp1-lang-bar-fill" />
                    <div className="sp1-lang-bar-glow" />
                  </div>
                  <span className="sp1-lang-pct">{barPct}%</span>
                </div>
                <div className="sp1-lang-yr-badge">
                  <span className="sp1-lang-yr-num">
                    {typeof l?.years === "number" ? l.years : safe(l?.years) || "—"}
                  </span>
                  <span className="sp1-lang-yr-unit">
                    {typeof l?.years === "number" ? "yr" : ""}
                  </span>
                </div>
              </div>
            );
          })}
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