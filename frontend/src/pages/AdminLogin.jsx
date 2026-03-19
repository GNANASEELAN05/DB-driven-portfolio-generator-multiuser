import React, { useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Tooltip,
  IconButton,
} from "@mui/material";
import { MdLock, MdLogin } from "react-icons/md";
import { RiShieldKeyholeFill } from "react-icons/ri";
import { useParams, useNavigate } from "react-router-dom";
import { adminLogin } from "../api/portfolio";

const CONTROLLER_PREFIX = "Controller-";

export default function AdminLogin() {
  const { username: urlUser } = useParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = "Admin Login";
  }, []);

  // ✅ if already logged in, go straight to dashboard
  React.useEffect(() => {
    const authUser = (localStorage.getItem("auth_user") || "").trim().toLowerCase();
    if (localStorage.getItem("token") && authUser) {
      window.location.replace(`/${authUser}/adminpanel`);
    }
  }, []);

  const [username, setUsername] = useState((urlUser || "").trim());
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ── Controller icon click ────────────────────────────────────
  const goToControllerLogin = () => {
    navigate("/controller/login");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const typed = username.trim();
      const uLower = typed.toLowerCase();
      const expected = (urlUser || "").trim().toLowerCase();

      // ── Both fields have Controller- prefix → silently redirect ──
      if (typed.startsWith(CONTROLLER_PREFIX) && password.startsWith(CONTROLLER_PREFIX)) {
        navigate("/controller/login");
        setLoading(false);
        return;
      }

      // ── Only one field has prefix → block and guide user ──
      if (typed.startsWith(CONTROLLER_PREFIX) || password.startsWith(CONTROLLER_PREFIX)) {
        setErr('Controller accounts must use the Controller Portal. Click the 🔐 icon at the top-right.');
        setLoading(false);
        return;
      }

      // ── Normal admin login ──────────────────────────────────
      if (expected && uLower !== expected) {
        setErr(`Please login using your own URL username: ${expected}`);
        setLoading(false);
        return;
      }

      const res = await adminLogin(uLower, password);

      const token =
        res &&
        res.data &&
        typeof res.data.token === "string" &&
        res.data.token.trim().length > 0
          ? res.data.token
          : null;

      if (!token) {
        setErr("Invalid username or password");
        setLoading(false);
        return;
      }

      const serverDisplay =
        res?.data?.username && typeof res.data.username === "string"
          ? res.data.username
          : typed;

      localStorage.removeItem("token");
      sessionStorage.clear();
      localStorage.setItem("token", token);
      localStorage.setItem("auth_user", uLower);
      localStorage.setItem("display_name", serverDisplay);

      window.location.replace(`/${uLower}/adminpanel`);
    } catch (error) {
      setErr("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 420, px: 2 }}>
        <Paper
          elevation={10}
          sx={{
            width: "100%",
            p: { xs: 3, sm: 5 },
            borderRadius: 5,
            backdropFilter: "blur(20px)",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            position: "relative",   // ← needed for absolute icon
          }}
        >
          {/* ── Controller Portal icon — top-right corner ── */}
          <Tooltip title="Controller Portal" placement="left" arrow>
            <IconButton
              onClick={goToControllerLogin}
              size="small"
              sx={{
                position: "absolute",
                top: 14,
                right: 14,
                color: "rgba(255,165,0,0.55)",
                background: "rgba(255,165,0,0.07)",
                border: "1px solid rgba(255,165,0,0.2)",
                width: 34,
                height: 34,
                fontSize: 17,
                transition: "all 0.25s ease",
                "&:hover": {
                  color: "#ffd700",
                  background: "rgba(255,165,0,0.16)",
                  border: "1px solid rgba(255,165,0,0.55)",
                  boxShadow: "0 0 14px rgba(255,165,0,0.35)",
                  transform: "scale(1.1)",
                },
              }}
            >
              <RiShieldKeyholeFill />
            </IconButton>
          </Tooltip>

          <Stack spacing={3}>
            <Stack alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#8b5cf6,#22d3ee)",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  fontSize: 32,
                }}
              >
                <MdLock />
              </Box>

              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 28,
                  textAlign: "center",
                  background: "linear-gradient(90deg,#a78bfa,#22d3ee)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Admin Portal
              </Typography>

              <Typography sx={{ opacity: 0.7, color: "#ddd", textAlign: "center" }}>
                Login to manage: <b>{(urlUser || "").trim()}</b>
              </Typography>
            </Stack>

            {err && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                {err}
              </Alert>
            )}

            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Username"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={inputStyle}
                />

                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={inputStyle}
                />

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<MdLogin />}
                  disabled={loading}
                  sx={{
                    mt: 1,
                    py: 1.4,
                    fontWeight: 900,
                    borderRadius: 3,
                    fontSize: 16,
                    background: "linear-gradient(135deg,#8b5cf6,#22d3ee)",
                    boxShadow: "0 10px 30px rgba(99,102,241,0.5)",
                  }}
                >
                  {loading ? "Signing in..." : "Login"}
                </Button>

                <Button
                  variant="text"
                  onClick={() => (window.location.href = "/register")}
                  sx={{ color: "#cbd5e1", fontWeight: 700 }}
                >
                  Create new account
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Typography sx={{ textAlign: "center", mt: 2, fontSize: 13, color: "#aaa" }}>
          Portfolio Admin Panel • Secure Access
        </Typography>
      </Box>
    </Box>
  );
}

const inputStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
  },
  "& .MuiInputLabel-root": {
    color: "#aaa",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.25)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#8b5cf6",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#22d3ee",
  },
};