// frontend/src/pages/HomePremium1.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Premium 1 Portfolio Viewer
// Same data fetching as Home.jsx — luxury dark-violet glass design.
// URL: /{username}/premium1
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Container, Typography, Stack, Chip, Divider,
  IconButton, Tooltip, AppBar, Toolbar, Button, CircularProgress,
} from "@mui/material";
import {
  MdEmail, MdPhone, MdOpenInNew, MdArrowBack,
  MdWorkspacePremium, MdLocationOn, MdDownload,
} from "react-icons/md";
import { FaGithub, FaLinkedin, FaGlobe } from "react-icons/fa";

import "./HomePremium1.css";

// ── API ───────────────────────────────────────────────────────────────────────
import {
  getProfile, getSkills, getFeaturedProjects, getSocials,
  getAchievements, getLanguageExperience, getEducation, getExperience,
} from "../api/portfolio";

const API_BASE = (
  import.meta.env.VITE_API_URL || "https://portfolio-backend-cok2.onrender.com/api"
);

function safe(v) { return v == null ? "" : String(v); }

// ─────────────────────────────────────────────────────────────────────────────

export default function HomePremium1() {
  const { username } = useParams();
  const navigate     = useNavigate();

  const [loading, setLoading]           = useState(true);
  const [profile, setProfile]           = useState({});
  const [skills, setSkills]             = useState({});
  const [projects, setProjects]         = useState([]);
  const [socials, setSocials]           = useState({});
  const [achievements, setAchievements] = useState([]);
  const [languages, setLanguages]       = useState([]);
  const [education, setEducation]       = useState([]);
  const [experience, setExperience]     = useState([]);

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      setLoading(true);
      try {
        const [p, sk, pr, so, ac, la, ed, ex] = await Promise.all([
          getProfile(username),
          getSkills(username),
          getFeaturedProjects(username),
          getSocials(username),
          getAchievements(username),
          getLanguageExperience(username),
          getEducation(username),
          getExperience(username),
        ]);
        setProfile(p?.data   || {});
        setSkills(sk?.data   || {});
        setProjects(pr?.data || []);
        setSocials(so?.data  || {});
        setAchievements(ac?.data || []);
        setLanguages(la?.data    || []);
        setEducation(ed?.data    || []);
        setExperience(ex?.data   || []);
      } catch {/* ignore */}
      finally { setLoading(false); }
    };
    load();
    document.title = `${username}'s Portfolio — Premium`;
  }, [username]);

  // parse skills
  const parseList = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(Boolean);
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  };

  const allSkills = [
    ...parseList(skills.frontend),
    ...parseList(skills.backend),
    ...parseList(skills.tools),
  ];

  const isCurrent = (exp) => !safe(exp.end).trim();

  const resumeUrl = `${API_BASE}/u/${username}/resume/download`;

  if (loading) {
    return (
      <Box className="p1-viewer" sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: "#8b5cf6" }} />
      </Box>
    );
  }

  return (
    <div className="p1-viewer">

      {/* ── Navbar ── */}
      <AppBar position="sticky" elevation={0} className="p1-navbar">
        <Toolbar sx={{ gap: 1 }}>
          <Typography className="p1-navbar-logo" variant="h6" sx={{ flexGrow: 1 }}>
            {safe(profile.name) || username}
          </Typography>

          <Chip
            icon={<MdWorkspacePremium style={{ color: "#fff", fontSize: 14 }} />}
            label="Premium 1"
            size="small"
            sx={{
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.68rem",
            }}
          />

          {/* Switch to free version */}
          <Tooltip title="View Free Version">
            <IconButton
              size="small"
              sx={{ color: "rgba(196,181,253,0.7)" }}
              onClick={() => navigate(`/${username}`)}
            >
              <MdArrowBack />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* ── Hero ── */}
      <section className="p1-hero">
        {/* avatar placeholder — same image system as free */}
        <div className="p1-avatar-ring">
          <img
            className="p1-avatar-img"
            src={`${API_BASE.replace(/\/api$/, "")}/api/profile-image/original`}
            alt="avatar"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>

        <Typography className="p1-hero-name">{safe(profile.name) || username}</Typography>
        <Typography className="p1-hero-title">{safe(profile.title)}</Typography>
        {safe(profile.tagline) && (
          <Typography className="p1-hero-tagline">{safe(profile.tagline)}</Typography>
        )}

        {safe(profile.location) && (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mt: 1.5, color: "rgba(196,181,253,0.6)" }}>
            <MdLocationOn />
            <Typography variant="body2">{safe(profile.location)}</Typography>
          </Stack>
        )}

        {/* CTA buttons */}
        <Stack
          direction="row"
          justifyContent="center"
          flexWrap="wrap"
          sx={{ mt: 3, gap: 1.5, px: { xs: 1, sm: 0 } }}
        >
          <Button
            variant="contained"
            href={`mailto:${safe(socials.email)}`}
            startIcon={<MdEmail />}
            sx={{
              borderRadius: 999,
              fontWeight: 800,
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              boxShadow: "0 4px 20px rgba(139,92,246,0.5)",
            }}
          >
            Contact Me
          </Button>

          <Button
            variant="outlined"
            href={resumeUrl}
            target="_blank"
            startIcon={<MdDownload />}
            sx={{
              borderRadius: 999,
              fontWeight: 800,
              borderColor: "rgba(139,92,246,0.5)",
              color: "#a78bfa",
            }}
          >
            Resume
          </Button>
        </Stack>
      </section>

      {/* ── Main sections ── */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>

        {/* ─── About ─── */}
        {safe(profile.about) && (
          <>
            <Typography className="p1-section-title">About Me</Typography>
            <div className="p1-card" style={{ marginBottom: 40 }}>
              <Typography sx={{ lineHeight: 1.8, color: "rgba(226,232,240,0.85)", whiteSpace: "pre-line" }}>
                {safe(profile.about)}
              </Typography>
            </div>
            <hr className="p1-divider" />
          </>
        )}

        {/* ─── Skills ─── */}
        {allSkills.length > 0 && (
          <>
            <Typography className="p1-section-title">Skills</Typography>
            <div className="p1-card" style={{ marginBottom: 40 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                {allSkills.map((s, i) => (
                  <span
                    key={i}
                    className="p1-skill-chip"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    {s}
                  </span>
                ))}
              </Box>

              {/* Language experience */}
              {languages.length > 0 && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography sx={{ color: "#a78bfa", fontWeight: 700, mb: 1, fontSize: "0.88rem" }}>
                    Language Experience
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {languages.map((l, i) => (
                      <Chip
                        key={i}
                        label={`${safe(l.language)}${safe(l.experience) ? ` · ${safe(l.experience)}` : ""}`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(6,182,212,0.1)",
                          border: "1px solid rgba(6,182,212,0.3)",
                          color: "#67e8f9",
                          fontWeight: 700,
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </div>
            <hr className="p1-divider" />
          </>
        )}

        {/* ─── Experience ─── */}
        {experience.length > 0 && (
          <>
            <Typography className="p1-section-title">Experience</Typography>
            <Box sx={{ mb: 5 }}>
              {experience.map((e, i) => (
                <div
                  key={i}
                  className={`p1-card p1-exp-card ${isCurrent(e) ? "p1-current" : ""}`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                    <Box>
                      <Typography sx={{ fontWeight: 900, color: "#c4b5fd", fontSize: "1.05rem" }}>
                        {safe(e.role)}
                      </Typography>
                      <Typography sx={{ color: "#a78bfa", fontWeight: 700 }}>{safe(e.company)}</Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Typography variant="caption" sx={{ color: "rgba(196,181,253,0.6)" }}>
                        {safe(e.start)}{safe(e.end) ? ` — ${safe(e.end)}` : ""}
                      </Typography>
                      {isCurrent(e) && (
                        <span className="p1-live-pill">
                          <span className="p1-live-dot" />
                          LIVE
                        </span>
                      )}
                    </Stack>
                  </Stack>
                  {safe(e.description) && (
                    <Typography variant="body2" sx={{ mt: 1.5, color: "rgba(226,232,240,0.75)", lineHeight: 1.75 }}>
                      {safe(e.description)}
                    </Typography>
                  )}
                </div>
              ))}
            </Box>
            <hr className="p1-divider" />
          </>
        )}

        {/* ─── Projects ─── */}
        {projects.length > 0 && (
          <>
            <Typography className="p1-section-title">Projects</Typography>
            <Box
              className="p1-projects-grid"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
                gap: 2.5,
                mb: 5,
              }}
            >
              {projects.map((p, i) => (
                <div key={i} className="p1-card" style={{ animationDelay: `${i * 0.08}s` }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography sx={{ fontWeight: 900, color: "#c4b5fd", fontSize: "0.97rem" }}>
                      {safe(p.title)}
                    </Typography>
                    {(safe(p.liveUrl) || safe(p.repoUrl)) && (
                      <Tooltip title={safe(p.liveUrl) || safe(p.repoUrl)}>
                        <IconButton
                          size="small"
                          component="a"
                          href={safe(p.liveUrl) || safe(p.repoUrl)}
                          target="_blank"
                          sx={{ color: "#8b5cf6" }}
                        >
                          <MdOpenInNew />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>

                  {safe(p.description) && (
                    <Typography variant="body2" sx={{ mt: 1, color: "rgba(226,232,240,0.7)", lineHeight: 1.65 }}>
                      {safe(p.description).slice(0, 150)}{safe(p.description).length > 150 ? "…" : ""}
                    </Typography>
                  )}

                  {safe(p.tech) && (
                    <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {safe(p.tech).split(",").map((t) => t.trim()).filter(Boolean).map((t, j) => (
                        <span key={j} className="p1-skill-chip" style={{ fontSize: "0.72rem", padding: "3px 10px", margin: 0 }}>
                          {t}
                        </span>
                      ))}
                    </Box>
                  )}

                  {safe(p.status) && (
                    <Chip
                      label={safe(p.status)}
                      size="small"
                      sx={{
                        mt: 1.5,
                        bgcolor: p.status === "Completed" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                        color: p.status === "Completed" ? "#10b981" : "#f59e0b",
                        border: `1px solid ${p.status === "Completed" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                        fontWeight: 700,
                      }}
                    />
                  )}
                </div>
              ))}
            </Box>
            <hr className="p1-divider" />
          </>
        )}

        {/* ─── Education ─── */}
        {education.length > 0 && (
          <>
            <Typography className="p1-section-title">Education</Typography>
            <Box className="p1-edu-timeline" sx={{ mb: 5 }}>
              {education.map((e, i) => (
                <Box key={i} sx={{ position: "relative", mb: 3 }}>
                  <div className="p1-edu-node" />
                  <div className="p1-card" style={{ animationDelay: `${i * 0.1}s` }}>
                    <Typography sx={{ fontWeight: 900, color: "#c4b5fd" }}>{safe(e.degree)}</Typography>
                    <Typography sx={{ color: "#a78bfa", fontWeight: 700, mt: 0.3 }}>{safe(e.institution)}</Typography>
                    {safe(e.year) && (
                      <Chip
                        label={safe(e.year)}
                        size="small"
                        sx={{
                          mt: 1,
                          bgcolor: "rgba(139,92,246,0.15)",
                          color: "#c4b5fd",
                          border: "1px solid rgba(139,92,246,0.3)",
                          fontWeight: 700,
                        }}
                      />
                    )}
                    {safe(e.details) && (
                      <Typography variant="body2" sx={{ mt: 1, color: "rgba(226,232,240,0.65)" }}>
                        {safe(e.details)}
                      </Typography>
                    )}
                  </div>
                </Box>
              ))}
            </Box>
            <hr className="p1-divider" />
          </>
        )}

        {/* ─── Achievements ─── */}
        {achievements.length > 0 && (
          <>
            <Typography className="p1-section-title">Achievements</Typography>
            <Box
              className="p1-ach-grid"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2.5,
                mb: 5,
              }}
            >
              {achievements.map((a, i) => (
                <div key={i} className="p1-card p1-ach-card">
                  <div className="p1-ach-foil" />
                  <Typography sx={{ fontWeight: 900, color: "#c4b5fd", fontSize: "0.97rem" }}>
                    {safe(a.title)}
                  </Typography>
                  {safe(a.issuer) && (
                    <Typography sx={{ color: "#a78bfa", fontWeight: 700, fontSize: "0.85rem", mt: 0.3 }}>
                      {safe(a.issuer)}
                    </Typography>
                  )}
                  {safe(a.date) && (
                    <Typography variant="caption" sx={{ color: "rgba(196,181,253,0.55)", display: "block", mt: 0.5 }}>
                      {safe(a.date)}
                    </Typography>
                  )}
                  {safe(a.description) && (
                    <Typography variant="body2" sx={{ mt: 1.2, color: "rgba(226,232,240,0.7)", lineHeight: 1.65 }}>
                      {safe(a.description)}
                    </Typography>
                  )}
                  {safe(a.link) && (
                    <Button
                      component="a"
                      href={safe(a.link)}
                      target="_blank"
                      size="small"
                      startIcon={<MdOpenInNew />}
                      sx={{ mt: 1.5, borderRadius: 999, color: "#8b5cf6", fontSize: "0.78rem" }}
                    >
                      View Certificate
                    </Button>
                  )}
                </div>
              ))}
            </Box>
            <hr className="p1-divider" />
          </>
        )}

        {/* ─── Contact ─── */}
        {(safe(socials.email) || safe(socials.github) || safe(socials.linkedin) || safe(socials.phone) || safe(socials.website)) && (
          <>
            <Typography className="p1-section-title">Contact</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.5, mb: 6 }}>
              {safe(socials.email) && (
                <a href={`mailto:${safe(socials.email)}`} className="p1-contact-link">
                  <MdEmail /> {safe(socials.email)}
                </a>
              )}
              {safe(socials.phone) && (
                <a href={`tel:${safe(socials.phone)}`} className="p1-contact-link">
                  <MdPhone /> {safe(socials.phone)}
                </a>
              )}
              {safe(socials.github) && (
                <a href={safe(socials.github)} target="_blank" rel="noopener noreferrer" className="p1-contact-link">
                  <FaGithub /> GitHub
                </a>
              )}
              {safe(socials.linkedin) && (
                <a href={safe(socials.linkedin)} target="_blank" rel="noopener noreferrer" className="p1-contact-link">
                  <FaLinkedin /> LinkedIn
                </a>
              )}
              {safe(socials.website) && (
                <a href={safe(socials.website)} target="_blank" rel="noopener noreferrer" className="p1-contact-link">
                  <FaGlobe /> Website
                </a>
              )}
            </Box>
          </>
        )}

      </Container>

      {/* ── Footer ── */}
      <footer className="p1-footer">
        <Typography variant="caption">
          Built with <span style={{ color: "#8b5cf6" }}>♥</span> by {safe(profile.name) || username} · Premium 1
        </Typography>
      </footer>
    </div>
  );
}