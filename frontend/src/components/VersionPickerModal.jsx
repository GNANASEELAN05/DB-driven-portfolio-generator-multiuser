// frontend/src/components/VersionPickerModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Drop-in modal shown when "Generate Portfolio" is clicked.
// Shows three plan cards: Free · Premium 1 (₹50) · Premium 2 (₹100)
// Handles Razorpay payment inline and unlocks the version on success.
// Includes ⚡ Skip (Test) button for dev/testing — bypasses Razorpay.
// Preview PDFs are fetched dynamically from the Controller backend.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, Box, Typography, Button,
  Chip, CircularProgress, Alert, IconButton, Tooltip,
} from "@mui/material";
import { MdClose, MdVisibility, MdLock, MdCheckCircle, MdStar } from "react-icons/md";
import { startPremiumPayment } from "../api/payment";

// ─────────────────────────────────────────────────────────────────────────────
// Backend base URL — update VITE_API_URL in your .env to override
// ─────────────────────────────────────────────────────────────────────────────
const BACKEND_BASE = (
  import.meta.env.VITE_API_URL ||
  "https://db-driven-portfolio-generator-multiuser-pq34.onrender.com/api"
).replace(/\/api\/?$/, "");

const API_BASE = `${BACKEND_BASE}/api`;

// ─────────────────────────────────────────────────────────────────────────────

const BRAND  = "#7a3f91";
const GOLD   = "#f59e0b";
const VIOLET = "#7c3aed";

export default function VersionPickerModal({
  open,
  onClose,
  hasPremium1,
  hasPremium2,
  username,
  onPremiumUnlocked,   // (newStatus) => void  — called after successful payment OR skip
  onGenerateFree,      // () => void
  onGeneratePremium1,  // () => void
  onGeneratePremium2,  // () => void
  onSkip,              // (version: 1|2) => void  — called after skip-unlock succeeds
}) {
  const [paying,   setPaying]   = useState(null); // 1 | 2 | null
  const [skipping, setSkipping] = useState(null); // 1 | 2 | null
  const [payErr,   setPayErr]   = useState("");
  const [payOk,    setPayOk]    = useState("");
  const [pdfUrl,   setPdfUrl]   = useState(null); // null = closed

  // ── Dynamic PDF preview URLs fetched from the Controller backend ───────────
  const [previewPdfUrls, setPreviewPdfUrls] = useState({
    premium1: null,
    premium2: null,
  });

  useEffect(() => {
    if (!open) return;

    const fetchPreviews = async () => {
      try {
        const [r1, r2] = await Promise.allSettled([
          fetch(`${API_BASE}/master-admin/preview-pdfs/latest/premium1`)
            .then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE}/master-admin/preview-pdfs/latest/premium2`)
            .then(r => r.ok ? r.json() : null),
        ]);

        setPreviewPdfUrls({
          premium1: r1.status === "fulfilled" && r1.value?.id
            ? `${API_BASE}/master-admin/preview-pdfs/${r1.value.id}/view`
            : null,
          premium2: r2.status === "fulfilled" && r2.value?.id
            ? `${API_BASE}/master-admin/preview-pdfs/${r2.value.id}/view`
            : null,
        });
      } catch {
        // Network error — leave both null, eye icons simply won't show
      }
    };

    fetchPreviews();
  }, [open]);

  // ── Razorpay payment ───────────────────────────────────────────────────────
  const handlePay = (version) => {
    setPayErr("");
    setPayOk("");
    setPaying(version);

    startPremiumPayment({
      version,
      username,
      onSuccess: (newStatus) => {
        setPaying(null);
        setPayOk(`🎉 Premium ${version} unlocked! Enjoy your new layout.`);
        onPremiumUnlocked(newStatus);
      },
      onError: (msg) => {
        setPaying(null);
        if (msg === "Payment cancelled") return;
        setPayErr(String(msg));
      },
    });
  };

  // ── Skip (test) — calls /api/payment/skip-unlock, no Razorpay ─────────────
  const handleSkip = async (version) => {
    setPayErr("");
    setPayOk("");
    setSkipping(version);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/payment/skip-unlock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ version }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const newStatus = await res.json();
      setPayOk(`✅ Test skip — Premium ${version} unlocked.`);
      onPremiumUnlocked(newStatus);
      if (onSkip) onSkip(version);
    } catch (e) {
      setPayErr("Skip failed: " + e.message);
    } finally {
      setSkipping(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  const plans = [
    {
      key: "free",
      label: "Free",
      price: "₹0",
      color: "#16a34a",
      features: ["Basic layout", "All your data", "Public URL"],
      locked: false,
      paid: true,
      onGenerate: onGenerateFree,
      previewPdf: null,
    },
    {
      key: "premium1",
      label: "Premium 1",
      price: "₹50",
      color: BRAND,
      version: 1,
      features: [
        "Luxury card design",
        "Animated sections",
        "Holographic effects",
        "Priority layout",
      ],
      locked: !hasPremium1,
      paid: hasPremium1,
      onGenerate: onGeneratePremium1,
      previewPdf: previewPdfUrls.premium1,
    },
    {
      key: "premium2",
      label: "Premium 2",
      price: "₹100",
      color: VIOLET,
      version: 2,
      features: [
        "All Premium 1 features",
        "3D animations",
        "Custom theme",
        "Coming soon…",
      ],
      locked: !hasPremium2,
      paid: hasPremium2,
      onGenerate: onGeneratePremium2,
      previewPdf: previewPdfUrls.premium2,
    },
  ];

  const busy = paying !== null || skipping !== null;

  // ── PDF iframe: mobile uses Google Docs viewer, desktop uses inline ────────
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const getPdfSrc = (url) => {
    if (!url) return "";
    return isMobile
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
      : `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
  };

  return (
    <>
      {/* ── PDF preview dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!pdfUrl} onClose={() => setPdfUrl(null)} maxWidth="md" fullWidth>
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
          <IconButton onClick={() => setPdfUrl(null)}>
            <MdClose />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0, height: "80vh" }}>
          {pdfUrl && (
            <iframe
              src={getPdfSrc(pdfUrl)}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Portfolio Preview"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Version Picker ─────────────────────────────────────────────────── */}
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            pt: 2.5,
            pb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Choose Your Portfolio Version
          </Typography>
          <IconButton onClick={onClose}>
            <MdClose />
          </IconButton>
        </Box>

        <DialogContent>
          {payErr && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {payErr}
            </Alert>
          )}
          {payOk && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {payOk}
            </Alert>
          )}

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              alignItems: "stretch",
            }}
          >
            {plans.map((plan) => (
              <Box
                key={plan.key}
                sx={{
                  flex: 1,
                  border: `2px solid ${plan.paid ? plan.color : "rgba(0,0,0,0.12)"}`,
                  borderRadius: 3,
                  p: 2.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  position: "relative",
                  background: plan.paid
                    ? `linear-gradient(135deg, ${plan.color}10, transparent)`
                    : "transparent",
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: `0 4px 24px ${plan.color}30` },
                }}
              >
                {/* ── Unlocked badge ── */}
                {plan.paid && plan.key !== "free" && (
                  <Chip
                    icon={<MdCheckCircle />}
                    label="Unlocked"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      bgcolor: plan.color,
                      color: "#fff",
                      fontWeight: 700,
                      "& .MuiChip-icon": { color: "#fff" },
                    }}
                  />
                )}

                {/* ── Name + price ── */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {plan.key !== "free" && (
                    <MdStar style={{ color: GOLD, fontSize: 20 }} />
                  )}
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 900, color: plan.color }}
                  >
                    {plan.label}
                  </Typography>
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  {plan.price}
                  {plan.key !== "free" && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ ml: 0.5 }}
                    >
                      one-time
                    </Typography>
                  )}
                </Typography>

                {/* ── Features ── */}
                <Box sx={{ flex: 1 }}>
                  {plan.features.map((f) => (
                    <Typography key={f} variant="body2" sx={{ py: 0.25 }}>
                      ✓ {f}
                    </Typography>
                  ))}
                </Box>

                {/* ── Eye icon — preview PDF (only shown if PDF uploaded in Controller) ── */}
                {plan.key !== "free" && (
                  plan.previewPdf ? (
                    <Tooltip title="Preview layout PDF">
                      <IconButton
                        size="small"
                        sx={{ alignSelf: "flex-start", color: plan.color }}
                        onClick={() => setPdfUrl(plan.previewPdf)}
                      >
                        <MdVisibility />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.4, fontSize: "0.7rem", alignSelf: "flex-start" }}
                    >
                      No preview available
                    </Typography>
                  )
                )}

                {/* ── Action buttons ── */}
                {plan.paid ? (
                  /* Already unlocked → Generate button */
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={plan.onGenerate}
                    sx={{
                      mt: 1,
                      borderRadius: 999,
                      fontWeight: 800,
                      background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                    }}
                  >
                    Generate {plan.label}
                  </Button>
                ) : (
                  /* Locked → Pay & Unlock  +  ⚡ Skip (Test) */
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
                    {/* Pay & Unlock */}
                    <Button
                      variant="outlined"
                      fullWidth
                      disabled={busy}
                      startIcon={
                        paying === plan.version ? (
                          <CircularProgress size={14} />
                        ) : (
                          <MdLock />
                        )
                      }
                      onClick={() => handlePay(plan.version)}
                      sx={{
                        borderRadius: 999,
                        fontWeight: 800,
                        borderColor: plan.color,
                        color: plan.color,
                      }}
                    >
                      {paying === plan.version ? "Processing…" : "Pay & Unlock"}
                    </Button>

                    {/* ⚡ Skip (Test) */}
                    <Button
                      variant="text"
                      fullWidth
                      size="small"
                      disabled={busy}
                      startIcon={
                        skipping === plan.version ? (
                          <CircularProgress size={12} />
                        ) : null
                      }
                      onClick={() => handleSkip(plan.version)}
                      sx={{
                        borderRadius: 999,
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        color: "text.secondary",
                        border: "1px dashed",
                        borderColor: "divider",
                        "&:hover": {
                          borderColor: plan.color,
                          color: plan.color,
                          background: `${plan.color}08`,
                        },
                      }}
                    >
                      {skipping === plan.version ? "Unlocking…" : "⚡ Skip (Test)"}
                    </Button>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}