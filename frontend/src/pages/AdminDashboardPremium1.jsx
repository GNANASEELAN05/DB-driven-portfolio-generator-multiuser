// frontend/src/pages/AdminDashboardPremium1.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Premium 1 Admin Dashboard — same data/logic as the free dashboard,
// but with the luxury glass/violet theme from AdminDashboardPremium1.css.
// All sections (about, skills, projects, etc.) use the same API calls.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from "react";
import {
  Box, AppBar, Toolbar, Drawer, Typography, IconButton, Button,
  List, ListItemButton, ListItemIcon, ListItemText, Divider,
  Container, Grid, Paper, TextField, Stack, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, CircularProgress, CssBaseline, useMediaQuery, useTheme,
  TextareaAutosize,
} from "@mui/material";
import {
  MdDashboard, MdPerson, MdBuild, MdWork, MdEmojiEvents, MdCode,
  MdSchool, MdBadge, MdLink, MdDescription, MdLogout, MdMenu,
  MdSave, MdAdd, MdDelete, MdRefresh, MdStar, MdVisibility,
  MdLightMode, MdDarkMode, MdArrowBack, MdWorkspacePremium,
} from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";

import "./AdminDashboardPremium1.css";

// ── API helpers (same as free dashboard) ─────────────────────────────────────
import {
  getProfile, getSkills, getAllProjectsAdmin, getSocials,
  getAchievements, getLanguageExperience, getEducation, getExperience,
  updateProfile, updateSkills, updateSocials, saveAchievements,
  saveLanguageExperience, updateEducation, updateExperience,
  addProject, updateProject, deleteProject,
} from "../api/portfolio";

// ─────────────────────────────────────────────────────────────────────────────

const DRAWER_W = 240;
const VIOLET   = "#8b5cf6";
const BRAND    = "#6d28d9";

function SmallField({ label, value, onChange, multiline, ...rest }) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      size="small"
      fullWidth
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      className="p1-field"
      sx={{ "& .MuiInputBase-root": { borderRadius: "10px" } }}
      {...rest}
    />
  );
}

function StatCard({ title, value, icon, color = VIOLET }) {
  return (
    <Paper className="p1-stat-card" sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "14px",
            background: `linear-gradient(135deg, ${color}30, ${color}18)`,
            border: `1px solid ${color}40`,
            display: "grid",
            placeItems: "center",
            color,
            fontSize: 22,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" sx={{ opacity: 0.65, letterSpacing: "0.06em" }}>
            {title}
          </Typography>
          <Typography className="p1-stat-number">{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboardPremium1({ setDarkMode }) {
  const { username } = useParams();
  const navigate     = useNavigate();
  const theme        = useTheme();
  const isMobile     = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive]         = useState("dashboard");
  const [loading, setLoading]       = useState(false);
  const [ok, setOk]                 = useState("");
  const [err, setErr]               = useState("");

  // ── Data states ──────────────────────────────────────────────────────────
  const [profile,      setProfile]      = useState({});
  const [skills,       setSkills]       = useState({ frontend: "", backend: "", tools: "" });
  const [projects,     setProjects]     = useState([]);
  const [socials,      setSocials]      = useState({});
  const [achievements, setAchievements] = useState([]);
  const [languages,    setLanguages]    = useState([]);
  const [education,    setEducation]    = useState([]);
  const [experience,   setExperience]   = useState([]);

  // ── Load all data ─────────────────────────────────────────────────────────
  const fetchAll = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const [p, sk, pr, so, ac, la, ed, ex] = await Promise.all([
        getProfile(username),
        getSkills(username),
        getAllProjectsAdmin(username),
        getSocials(username),
        getAchievements(username),
        getLanguageExperience(username),
        getEducation(username),
        getExperience(username),
      ]);
      setProfile(p?.data  || {});
      setSkills(sk?.data  || { frontend: "", backend: "", tools: "" });
      setProjects(pr?.data || []);
      setSocials(so?.data  || {});
      setAchievements(ac?.data || []);
      setLanguages(la?.data    || []);
      setEducation(ed?.data    || []);
      setExperience(ex?.data   || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [username]);

  const flash = (msg, isErr = false) => {
    if (isErr) setErr(msg); else setOk(msg);
    setTimeout(() => { setErr(""); setOk(""); }, 3000);
  };

  // ── Saves ─────────────────────────────────────────────────────────────────
  const save = async (fn, data, label) => {
    try {
      await fn(username, data);
      flash(`${label} saved ✓`);
    } catch { flash(`Save failed`, true); }
  };

  // ── Sidebar nav ──────────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard",    label: "Dashboard",        icon: <MdDashboard /> },
    { id: "about",        label: "About Me",          icon: <MdPerson /> },
    { id: "skills",       label: "Skills",            icon: <MdBuild /> },
    { id: "projects",     label: "Projects",          icon: <MdWork /> },
    { id: "achievements", label: "Achievements",      icon: <MdEmojiEvents /> },
    { id: "languages",    label: "Languages",         icon: <MdCode /> },
    { id: "education",    label: "Education",         icon: <MdSchool /> },
    { id: "experience",   label: "Experience",        icon: <MdBadge /> },
    { id: "contact",      label: "Contact / Links",   icon: <MdLink /> },
  ];

  const sidebar = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }} className="p1-sidebar">
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 2.5, display: "flex", alignItems: "center", gap: 1.2 }}>
        <Box
          sx={{
            width: 38, height: 38, borderRadius: "10px",
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            display: "grid", placeItems: "center", color: "#fff", fontSize: 20,
          }}
        >
          <MdWorkspacePremium />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 900, color: "#c4b5fd", fontSize: "0.92rem", lineHeight: 1 }}>
            Portfolio Admin
          </Typography>
          <span className="p1-premium-badge">PREMIUM 1</span>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(139,92,246,0.2)" }} />

      <List sx={{ px: 1, py: 1, flex: 1 }}>
        {navItems.map((it) => (
          <ListItemButton
            key={it.id}
            selected={active === it.id}
            className="p1-nav-item"
            onClick={() => { setActive(it.id); setMobileOpen(false); }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>{it.icon}</ListItemIcon>
            <ListItemText primary={it.label} primaryTypographyProps={{ fontWeight: 800, fontSize: "0.88rem" }} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ borderColor: "rgba(139,92,246,0.2)" }} />

      <Box sx={{ p: 1.5 }}>
        {/* Switch to free */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<MdArrowBack />}
          size="small"
          onClick={() => navigate(`/${username}/adminpanel`)}
          sx={{
            mb: 1, borderRadius: 999, fontWeight: 800, fontSize: "0.78rem",
            borderColor: "rgba(139,92,246,0.4)", color: "#a78bfa",
          }}
        >
          Free Version
        </Button>
        {/* View premium viewer */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<MdVisibility />}
          size="small"
          onClick={() => window.open(`/${username}/premium1`, "_blank")}
          sx={{
            mb: 1, borderRadius: 999, fontWeight: 800, fontSize: "0.78rem",
            borderColor: "rgba(139,92,246,0.4)", color: "#a78bfa",
          }}
        >
          View Portfolio
        </Button>
        {/* Logout */}
        <Button
          fullWidth
          variant="contained"
          startIcon={<MdLogout />}
          size="small"
          onClick={() => { localStorage.removeItem("token"); window.location.href = "/admin-login"; }}
          sx={{
            borderRadius: 999, fontWeight: 800, fontSize: "0.78rem",
            background: "linear-gradient(135deg, #dc2626, #991b1b)",
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0d0d1a, #1a0533 60%, #0d0d1a)",
      }}
    >
      <CssBaseline />

      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        className="p1-appbar"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {isMobile && (
            <IconButton color="inherit" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 0.5 }}>
              <MdMenu />
            </IconButton>
          )}

          <Typography sx={{ fontWeight: 900, flexGrow: 1, color: "#c4b5fd" }}>
            {navItems.find((n) => n.id === active)?.label || "Premium Dashboard"}
          </Typography>

          <Chip
            icon={<MdWorkspacePremium style={{ color: "#fff" }} />}
            label="Premium 1"
            size="small"
            className="p1-premium-badge"
            sx={{ mr: 1 }}
          />

          {/* Generate portfolio button */}
          <Button
            variant="contained"
            size="small"
            className="p1-generate-btn"
            onClick={() => window.open(`/${username}/premium1`, "_blank")}
            sx={{ borderRadius: 999, fontWeight: 950, textTransform: "none" }}
          >
            View Portfolio
          </Button>

          <Tooltip title="Refresh">
            <IconButton color="inherit" onClick={fetchAll}>
              <MdRefresh />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav" sx={{ width: { md: DRAWER_W }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ className: "p1-sidebar" }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_W } }}
        >
          {sidebar}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          PaperProps={{ className: "p1-sidebar" }}
          sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width: DRAWER_W, boxSizing: "border-box" } }}
        >
          {sidebar}
        </Drawer>
      </Box>

      {/* Main */}
      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, width: { md: `calc(100% - ${DRAWER_W}px)` }, pb: 6 }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>

          {ok  && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{ok}</Alert>}
          {err && <Alert severity="error"   sx={{ mb: 2, borderRadius: 3 }}>{err}</Alert>}

          {/* Version banner */}
          <div className="p1-version-banner">
            <MdWorkspacePremium style={{ color: "#a78bfa", fontSize: 22 }} />
            <Box>
              <Typography sx={{ fontWeight: 900, color: "#c4b5fd", fontSize: "0.9rem" }}>
                Premium 1 Dashboard
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "rgba(196,181,253,0.7)" }}>
                Your data is shared with the free version. Only the layout changes.
              </Typography>
            </Box>
          </div>

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress sx={{ color: VIOLET }} />
            </Box>
          )}

          {/* ─── DASHBOARD ─── */}
          {!loading && active === "dashboard" && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Projects"     value={projects.length}     icon={<MdWork />} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Achievements" value={achievements.length} icon={<MdEmojiEvents />} color="#ec4899" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Education"    value={education.length}    icon={<MdSchool />}     color="#06b6d4" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Experience"   value={experience.length}   icon={<MdBadge />}      color="#f59e0b" />
              </Grid>
            </Grid>
          )}

          {/* ─── ABOUT ─── */}
          {!loading && active === "about" && (
            <Paper className="p1-section-paper" sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 900, color: "#c4b5fd" }}>About Me</Typography>
                <Button
                  className="p1-save-btn"
                  variant="contained"
                  size="small"
                  startIcon={<MdSave />}
                  onClick={() => save(updateProfile, profile, "Profile")}
                >
                  Save
                </Button>
              </Stack>
              <Grid container spacing={2}>
                {["name", "title", "tagline", "location", "emailPublic", "initials"].map((f) => (
                  <Grid item xs={12} sm={6} key={f}>
                    <SmallField
                      label={f.charAt(0).toUpperCase() + f.slice(1)}
                      value={profile[f] || ""}
                      onChange={(e) => setProfile((p) => ({ ...p, [f]: e.target.value }))}
                    />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <SmallField
                    label="About"
                    value={profile.about || ""}
                    onChange={(e) => setProfile((p) => ({ ...p, about: e.target.value }))}
                    multiline
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* ─── SKILLS ─── */}
          {!loading && active === "skills" && (
            <Paper className="p1-section-paper" sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 900, color: "#c4b5fd" }}>Skills</Typography>
                <Button
                  className="p1-save-btn"
                  variant="contained"
                  size="small"
                  startIcon={<MdSave />}
                  onClick={() => save(updateSkills, skills, "Skills")}
                >
                  Save
                </Button>
              </Stack>
              <Grid container spacing={2}>
                {["frontend", "backend", "tools"].map((f) => (
                  <Grid item xs={12} sm={4} key={f}>
                    <SmallField
                      label={f.charAt(0).toUpperCase() + f.slice(1)}
                      value={Array.isArray(skills[f]) ? skills[f].join(", ") : (skills[f] || "")}
                      onChange={(e) => setSkills((s) => ({ ...s, [f]: e.target.value }))}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* ─── PROJECTS ─── */}
          {!loading && active === "projects" && (
            <Paper className="p1-section-paper" sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 900, color: "#c4b5fd" }}>Projects</Typography>
                <Button
                  className="p1-save-btn"
                  variant="contained"
                  size="small"
                  startIcon={<MdAdd />}
                  onClick={async () => {
                    try {
                      await addProject(username, { title: "New Project", description: "", tech: "", status: "In Progress", featured: false });
                      flash("Project added");
                      fetchAll();
                    } catch { flash("Failed", true); }
                  }}
                >
                  Add
                </Button>
              </Stack>
              <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <Table size="small" className="p1-table" sx={{ minWidth: 480 }}>
                  <TableHead>
                    <TableRow className="p1-table-head">
                      <TableCell>#</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Featured</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.map((p, i) => (
                      <TableRow key={p.id} className="p1-table-row" hover>
                        <TableCell sx={{ color: "rgba(255,255,255,0.5)" }}>{i + 1}</TableCell>
                        <TableCell sx={{ color: "#c4b5fd", fontWeight: 700 }}>{p.title}</TableCell>
                        <TableCell>
                          <Chip
                            label={p.status || "—"}
                            size="small"
                            sx={{ bgcolor: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}
                          />
                        </TableCell>
                        <TableCell>
                          {p.featured ? <Chip label="Featured" size="small" sx={{ bgcolor: "rgba(245,158,11,0.15)", color: "#f59e0b" }} /> : "—"}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              sx={{ color: "#f87171" }}
                              onClick={async () => {
                                try { await deleteProject(username, p.id); flash("Deleted"); fetchAll(); }
                                catch { flash("Delete failed", true); }
                              }}
                            >
                              <MdDelete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {projects.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                          No projects yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          )}

          {/* ─── ACHIEVEMENTS ─── */}
          {!loading && active === "achievements" && (
            <Paper className="p1-section-paper" sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 900, color: "#c4b5fd" }}>Achievements</Typography>
                <Button
                  className="p1-save-btn"
                  variant="contained"
                  size="small"
                  startIcon={<MdSave />}
                  onClick={() => save(saveAchievements, achievements, "Achievements")}
                >
                  Save
                </Button>
              </Stack>
              {achievements.map((a, i) => (
                <Paper
                  key={i}
                  sx={{
                    p: 2, mb: 1.5, borderRadius: 3,
                    background: "rgba(139,92,246,0.08)",
                    border: "1px solid rgba(139,92,246,0.18)",
                  }}
                >
                  <Grid container spacing={1.5} alignItems="flex-start">
                    {["title", "issuer", "date", "description"].map((f) => (
                      <Grid item xs={12} sm={f === "description" ? 12 : 4} key={f}>
                        <SmallField
                          label={f.charAt(0).toUpperCase() + f.slice(1)}
                          value={a[f] || ""}
                          multiline={f === "description"}
                          onChange={(e) => {
                            const updated = [...achievements];
                            updated[i] = { ...updated[i], [f]: e.target.value };
                            setAchievements(updated);
                          }}
                        />
                      </Grid>
                    ))}
                    <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <IconButton
                        size="small"
                        sx={{ color: "#f87171" }}
                        onClick={() => setAchievements((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <MdDelete />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              <Button
                startIcon={<MdAdd />}
                size="small"
                sx={{ color: "#a78bfa", mt: 1 }}
                onClick={() => setAchievements((prev) => [...prev, { title: "", issuer: "", date: "", description: "" }])}
              >
                Add Achievement
              </Button>
            </Paper>
          )}

          {/* ─── EDUCATION ─── */}
          {!loading && active === "education" && (
            <Paper className="p1-section-paper" sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 900, color: "#c4b5fd" }}>Education</Typography>
                <Button
                  className="p1-save-btn"
                  variant="contained"
                  size="small"
                  startIcon={<MdSave />}
                  onClick={() => save(updateEducation, education, "Education")}
                >
                  Save
                </Button>
              </Stack>
              {education.map((e, i) => (
                <Paper
                  key={i}
                  sx={{ p: 2, mb: 1.5, borderRadius: 3, background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.18)" }}
                >
                  <Grid container spacing={1.5}>
                    {["degree", "institution", "year", "details"].map((f) => (
                      <Grid item xs={12} sm={f === "details" ? 12 : 4} key={f}>
                        <SmallField
                          label={f.charAt(0).toUpperCase() + f.slice(1)}
                          value={e[f] || ""}
                          multiline={f === "details"}
                          onChange={(ev) => {
                            const updated = [...education];
                            updated[i] = { ...updated[i], [f]: ev.target.value };
                            setEducation(updated);
                          }}
                        />
                      </Grid>
                    ))}
                    <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <IconButton size="small" sx={{ color: "#f87171" }} onClick={() => setEducation((p) => p.filter((_, idx) => idx !== i))}>
                        <MdDelete />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              <Button
                startIcon={<MdAdd />}
                size="small"
                sx={{ color: "#a78bfa", mt: 1 }}
                onClick={() => setEducation((p) => [...p, { degree: "", institution: "", year: "", details: "" }])}
              >
                Add Education
              </Button>
            </Paper>
          )}

          {/* ─── EXPERIENCE ─── */}
          {!loading && active === "experience" && (
            <Paper className="p1-section-paper" sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 900, color: "#c4b5fd" }}>Experience</Typography>
                <Button
                  className="p1-save-btn"
                  variant="contained"
                  size="small"
                  startIcon={<MdSave />}
                  onClick={() => save(updateExperience, experience, "Experience")}
                >
                  Save
                </Button>
              </Stack>
              {experience.map((e, i) => (
                <Paper
                  key={i}
                  sx={{ p: 2, mb: 1.5, borderRadius: 3, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)" }}
                >
                  <Grid container spacing={1.5}>
                    {["role", "company", "start", "end", "description"].map((f) => (
                      <Grid item xs={12} sm={f === "description" ? 12 : 6} key={f}>
                        <SmallField
                          label={f.charAt(0).toUpperCase() + f.slice(1)}
                          value={e[f] || ""}
                          multiline={f === "description"}
                          onChange={(ev) => {
                            const updated = [...experience];
                            updated[i] = { ...updated[i], [f]: ev.target.value };
                            setExperience(updated);
                          }}
                        />
                      </Grid>
                    ))}
                    <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <IconButton size="small" sx={{ color: "#f87171" }} onClick={() => setExperience((p) => p.filter((_, idx) => idx !== i))}>
                        <MdDelete />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              <Button
                startIcon={<MdAdd />}
                size="small"
                sx={{ color: "#a78bfa", mt: 1 }}
                onClick={() => setExperience((p) => [...p, { role: "", company: "", start: "", end: "", description: "" }])}
              >
                Add Experience
              </Button>
            </Paper>
          )}

          {/* ─── LANGUAGES ─── */}
          {!loading && active === "languages" && (
            <Paper className="p1-section-paper" sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 900, color: "#c4b5fd" }}>Languages Experience</Typography>
                <Button
                  className="p1-save-btn"
                  variant="contained"
                  size="small"
                  startIcon={<MdSave />}
                  onClick={() => save(saveLanguageExperience, languages, "Languages")}
                >
                  Save
                </Button>
              </Stack>
              {languages.map((l, i) => (
                <Stack key={i} direction="row" spacing={1.5} sx={{ mb: 1.5 }} alignItems="center">
                  <SmallField label="Language" value={l.language || ""} onChange={(e) => {
                    const u = [...languages]; u[i] = { ...u[i], language: e.target.value }; setLanguages(u);
                  }} />
                  <SmallField label="Years / Level" value={l.experience || ""} onChange={(e) => {
                    const u = [...languages]; u[i] = { ...u[i], experience: e.target.value }; setLanguages(u);
                  }} />
                  <IconButton size="small" sx={{ color: "#f87171" }} onClick={() => setLanguages((p) => p.filter((_, idx) => idx !== i))}>
                    <MdDelete />
                  </IconButton>
                </Stack>
              ))}
              <Button
                startIcon={<MdAdd />}
                size="small"
                sx={{ color: "#a78bfa" }}
                onClick={() => setLanguages((p) => [...p, { language: "", experience: "" }])}
              >
                Add Language
              </Button>
            </Paper>
          )}

          {/* ─── CONTACT ─── */}
          {!loading && active === "contact" && (
            <Paper className="p1-section-paper" sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 900, color: "#c4b5fd" }}>Contact / Social Links</Typography>
                <Button
                  className="p1-save-btn"
                  variant="contained"
                  size="small"
                  startIcon={<MdSave />}
                  onClick={() => save(updateSocials, socials, "Contact")}
                >
                  Save
                </Button>
              </Stack>
              <Grid container spacing={2}>
                {["email", "phone", "github", "linkedin", "website"].map((f) => (
                  <Grid item xs={12} sm={6} key={f}>
                    <SmallField
                      label={f.charAt(0).toUpperCase() + f.slice(1)}
                      value={socials[f] || ""}
                      onChange={(e) => setSocials((s) => ({ ...s, [f]: e.target.value }))}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

        </Container>
      </Box>
    </Box>
  );
}