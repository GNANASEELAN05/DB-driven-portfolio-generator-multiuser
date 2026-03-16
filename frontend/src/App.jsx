import React, { useMemo, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Register from "./pages/Register";
import AdminDashboardPremium1 from "./pages/AdminDashboardPremium1";
import HomePremium1 from "./pages/HomePremium1";

const makeTheme = (mode, flavor = "viewer") => {
  const viewerPrimary = "#7C3AED";
  const viewerSecondary = "#06B6D4";
  const adminPrimary = "#F59E0B";
  const adminSecondary = "#3B82F6";
  const primary = flavor === "admin" ? adminPrimary : viewerPrimary;
  const secondary = flavor === "admin" ? adminSecondary : viewerSecondary;
  return createTheme({
    palette: {
      mode,
      primary: { main: primary },
      secondary: { main: secondary },
      background: {
        default: mode === "dark" ? "#0B1220" : "#F6F7FB",
        paper: mode === "dark" ? "#0F1A2B" : "#FFFFFF",
      },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: `"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial`,
    },
  });
};

export default function App() {
  const [viewerDark, setViewerDark] = useState(
    localStorage.getItem("viewer_theme")
      ? localStorage.getItem("viewer_theme") === "dark"
      : true
  );
  const [adminDark, setAdminDark] = useState(
    localStorage.getItem("admin_theme")
      ? localStorage.getItem("admin_theme") === "dark"
      : true
  );
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const checkToken = () => setLoggedIn(!!localStorage.getItem("token"));
    window.addEventListener("storage", checkToken);
    window.addEventListener("focus", checkToken);
    return () => {
      window.removeEventListener("storage", checkToken);
      window.removeEventListener("focus", checkToken);
    };
  }, []);

  const viewerTheme = useMemo(() => makeTheme(viewerDark ? "dark" : "light", "viewer"), [viewerDark]);
  const adminTheme = useMemo(() => makeTheme(adminDark ? "dark" : "light", "admin"), [adminDark]);

  const toggleViewerTheme = () => {
    setViewerDark((prev) => { const next = !prev; localStorage.setItem("viewer_theme", next ? "dark" : "light"); return next; });
  };
  const toggleAdminTheme = () => {
    setAdminDark((prev) => { const next = !prev; localStorage.setItem("admin_theme", next ? "dark" : "light"); return next; });
  };

  const getAuthUser = () => (localStorage.getItem("auth_user") || "").trim().toLowerCase();
  const hasToken = () => !!localStorage.getItem("token");

  const RedirectToBest = () => {
    const authUser = getAuthUser();
    if (!hasToken() || !authUser) return <Navigate to="/register" replace />;
    const hasPremium2 = localStorage.getItem(`premium2_${authUser}`) === "true";
    const hasPremium1 = localStorage.getItem(`premium1_${authUser}`) === "true";
    if (hasPremium2) return <Navigate to={`/${authUser}/premium2`} replace />;
    if (hasPremium1) return <Navigate to={`/${authUser}/premium1`} replace />;
    return <Navigate to={`/${authUser}/adminpanel`} replace />;
  };

  const IfAuthedGoDashboard = ({ children }) => {
    const authUser = getAuthUser();
    if (hasToken() && authUser) return <Navigate to={`/${authUser}/adminpanel`} replace />;
    return children;
  };

  const RequireAuth = ({ children }) => {
    const { username } = useParams();
    const authUser = getAuthUser();
    if (!hasToken() || !authUser) return <Navigate to="/admin-login" replace />;
    const urlUser = (username || "").trim().toLowerCase();
    if (urlUser && authUser !== urlUser) return <Navigate to={`/${authUser}/adminpanel`} replace />;
    return children;
  };

  const PremiumRedirectWrapper = () => {
    const { username } = useParams();
    const authUser = getAuthUser();
    if (authUser && authUser === (username || "").toLowerCase()) {
      const hasPremium2 = localStorage.getItem(`premium2_${authUser}`) === "true";
      const hasPremium1 = localStorage.getItem(`premium1_${authUser}`) === "true";
      if (hasPremium2) return <Navigate to={`/${username}/premium2`} replace />;
      if (hasPremium1) return <Navigate to={`/${username}/premium1`} replace />;
    }
    return <Home toggleTheme={toggleViewerTheme} />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RedirectToBest />} />

        <Route path="/register" element={<IfAuthedGoDashboard><ThemeProvider theme={viewerTheme}><CssBaseline /><Register /></ThemeProvider></IfAuthedGoDashboard>} />

        <Route path="/admin-login" element={<IfAuthedGoDashboard><ThemeProvider theme={adminTheme}><CssBaseline /><AdminLogin /></ThemeProvider></IfAuthedGoDashboard>} />

        <Route path="/:username" element={<ThemeProvider theme={viewerTheme}><CssBaseline /><PremiumRedirectWrapper /></ThemeProvider>} />

        <Route path="/:username/premium1" element={<ThemeProvider theme={viewerTheme}><CssBaseline /><HomePremium1 toggleTheme={toggleViewerTheme} /></ThemeProvider>} />

        <Route path="/:username/adminpanel/login" element={<IfAuthedGoDashboard><ThemeProvider theme={adminTheme}><CssBaseline /><AdminLogin /></ThemeProvider></IfAuthedGoDashboard>} />

        <Route path="/:username/adminpanel" element={<RequireAuth><ThemeProvider theme={adminTheme}><CssBaseline /><AdminDashboard setDarkMode={toggleAdminTheme} /></ThemeProvider></RequireAuth>} />

        <Route path="/:username/adminpanel/premium1" element={<RequireAuth><ThemeProvider theme={adminTheme}><CssBaseline /><AdminDashboardPremium1 setDarkMode={toggleAdminTheme} /></ThemeProvider></RequireAuth>} />

        <Route path="*" element={<RedirectToBest />} />
      </Routes>
    </BrowserRouter>
  );
}