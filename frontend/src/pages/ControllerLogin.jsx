import React, { useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography, Alert, CircularProgress } from "@mui/material";
import { MdShield, MdLogin, MdArrowBack } from "react-icons/md";
import { RiShieldKeyholeFill } from "react-icons/ri";

// ─── API call ────────────────────────────────────────────────
async function controllerLogin(username, password) {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/master-admin/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }
  );
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json();
}

export default function ControllerLogin() {
  React.useEffect(() => {
    document.title = "Controller Portal";
  }, []);

  // If already logged in as controller, redirect
  React.useEffect(() => {
    if (localStorage.getItem("controller_token")) {
      window.location.replace("/controller/dashboard");
    }
  }, []);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

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
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 20% 50%, #0a0f1e 0%, #000308 60%), linear-gradient(135deg,#000308,#050d1a)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background grid lines */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,215,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Glow orb */}
      <Box
        sx={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,165,0,0.08) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          pointerEvents: "none",
        }}
      />

      <Box sx={{ width: "100%", maxWidth: 440, px: 2, zIndex: 1 }}>
        {/* Back button */}
        <Button
          startIcon={<MdArrowBack />}
          onClick={() => window.history.back()}
          sx={{
            color: "rgba(255,165,0,0.7)",
            fontWeight: 700,
            mb: 2,
            "&:hover": { color: "#ffa500" },
          }}
        >
          Back to Admin Login
        </Button>

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            backdropFilter: "blur(30px)",
            background: "rgba(255,165,0,0.04)",
            border: "1px solid rgba(255,165,0,0.2)",
            boxShadow: "0 0 60px rgba(255,140,0,0.08), 0 20px 60px rgba(0,0,0,0.8)",
          }}
        >
          <Stack spacing={3}>
            <Stack alignItems="center" spacing={1.5}>
              {/* Shield icon with gold ring */}
              <Box sx={{ position: "relative", display: "inline-flex" }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#b8860b,#ffd700,#ff8c00)",
                    display: "grid",
                    placeItems: "center",
                    color: "#000",
                    fontSize: 36,
                    boxShadow: "0 0 30px rgba(255,165,0,0.4)",
                  }}
                >
                  <RiShieldKeyholeFill />
                </Box>
                {/* Pulse ring */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: -6,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,165,0,0.3)",
                    animation: "ctrlPulse 2s ease-in-out infinite",
                    "@keyframes ctrlPulse": {
                      "0%,100%": { transform: "scale(1)", opacity: 0.3 },
                      "50%": { transform: "scale(1.1)", opacity: 0.7 },
                    },
                  }}
                />
              </Box>

              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 26,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  background: "linear-gradient(90deg,#b8860b,#ffd700,#ff8c00)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                Controller Portal
              </Typography>

              <Typography
                sx={{
                  color: "rgba(255,165,0,0.5)",
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                ⚠ Restricted System Access ⚠
              </Typography>
            </Stack>

            {/* Warning banner */}
            <Box
              sx={{
                border: "1px solid rgba(255,165,0,0.25)",
                borderRadius: 2,
                p: 1.5,
                background: "rgba(255,140,0,0.05)",
                textAlign: "center",
              }}
            >
              <Typography sx={{ color: "rgba(255,165,0,0.7)", fontSize: 12, letterSpacing: 1 }}>
                Unauthorized access is strictly prohibited and logged.
              </Typography>
            </Box>

            {err && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: 2,
                  background: "rgba(255,0,0,0.1)",
                  border: "1px solid rgba(255,0,0,0.3)",
                  color: "#ff6b6b",
                  "& .MuiAlert-icon": { color: "#ff6b6b" },
                }}
              >
                {err}
              </Alert>
            )}

            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Controller Username"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  sx={inputStyle}
                />

                <TextField
                  label="Controller Password"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={inputStyle}
                />

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={18} sx={{ color: "#000" }} /> : <MdLogin />}
                  disabled={loading}
                  sx={{
                    mt: 1,
                    py: 1.5,
                    fontWeight: 900,
                    borderRadius: 2,
                    fontSize: 15,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    fontFamily: "'Courier New', monospace",
                    background: "linear-gradient(135deg,#b8860b,#ffd700,#ff8c00)",
                    color: "#000",
                    boxShadow: "0 8px 25px rgba(255,165,0,0.3)",
                    "&:hover": {
                      background: "linear-gradient(135deg,#ffd700,#ff8c00)",
                      boxShadow: "0 8px 35px rgba(255,165,0,0.5)",
                    },
                    "&:disabled": { opacity: 0.6 },
                  }}
                >
                  {loading ? "Authenticating..." : "Authorize Access"}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Typography
          sx={{
            textAlign: "center",
            mt: 2,
            fontSize: 11,
            color: "rgba(255,165,0,0.3)",
            letterSpacing: 2,
            textTransform: "uppercase",
            fontFamily: "'Courier New', monospace",
          }}
        >
          Platform Controller • Master Access
        </Typography>
      </Box>
    </Box>
  );
}

const inputStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    background: "rgba(255,165,0,0.05)",
    color: "#ffd700",
    fontFamily: "'Courier New', monospace",
  },
  "& .MuiInputLabel-root": { color: "rgba(255,165,0,0.6)" },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,165,0,0.2)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,165,0,0.5)",
  },
  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#ffd700",
  },
};