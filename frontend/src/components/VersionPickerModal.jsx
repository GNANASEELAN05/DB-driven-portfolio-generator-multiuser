// frontend/src/components/VersionPickerModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Drop-in modal shown when "Generate Portfolio" is clicked.
// Shows three plan cards: Free · Premium 1 (₹50) · Premium 2 (₹100)
// Handles Razorpay payment inline and unlocks the version on success.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import {
  Dialog, DialogContent, Box, Typography, Button,
  Chip, CircularProgress, Alert, IconButton, Tooltip,
} from "@mui/material";
import { MdClose, MdVisibility, MdLock, MdCheckCircle, MdStar } from "react-icons/md";
import { startPremiumPayment } from "../api/payment";

// ── PDF preview for the "eye" icon ──────────────────────────────────────────
//
//  HOW TO MAP YOUR PDF TO THE EYE ICON
//  ------------------------------------
//  Option A (easiest – hosted in your backend):
//    Upload a PDF called "premium_preview.pdf" to your backend public static
//    folder: backend/src/main/resources/static/premium_preview.pdf
//    Then set:
//      const PREMIUM1_PREVIEW_PDF = `${BACKEND_BASE}/premium_preview.pdf`;
//      const PREMIUM2_PREVIEW_PDF = `${BACKEND_BASE}/premium_preview2.pdf`;
//
//  Option B (Vercel public folder):
//    Put the PDF in frontend/public/premium_preview.pdf
//    Then set:
//      const PREMIUM1_PREVIEW_PDF = "/premium_preview.pdf";
//
//  Option C (Google Drive / external link):
//    Just paste any public PDF URL below.
// ─────────────────────────────────────────────────────────────────────────────

const BACKEND_BASE = (
  import.meta.env.VITE_API_URL || "https://portfolio-backend-cok2.onrender.com/api"
).replace(/\/api$/, "");

// ← CHANGE THESE TWO LINES to your actual PDF paths (see options above)
const PREMIUM1_PREVIEW_PDF = `${BACKEND_BASE}/premium_preview1.pdf`;
const PREMIUM2_PREVIEW_PDF = `${BACKEND_BASE}/premium_preview2.pdf`;

// ─────────────────────────────────────────────────────────────────────────────

const BRAND = "#7a3f91";
const GOLD  = "#f59e0b";
const VIOLET = "#7c3aed";

export default function VersionPickerModal({
  open,
  onClose,
  hasPremium1,
  hasPremium2,
  username,
  onPremiumUnlocked,    // (newStatus) => void  — called after successful payment
  onGenerateFree,       // () => void           — called when "Generate Free" clicked
  onGeneratePremium1,   // () => void           — called when "Generate Premium 1" clicked
  onGeneratePremium2,   // () => void           — called when "Generate Premium 2" clicked
}) {
  const [paying, setPaying]     = useState(null); // 1 | 2 | null
  const [payErr, setPayErr]     = useState("");
  const [payOk, setPayOk]       = useState("");
  const [pdfUrl, setPdfUrl]     = useState(null); // null = closed

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
      features: ["Luxury card design", "Animated sections", "Holographic effects", "Priority layout"],
      locked: !hasPremium1,
      paid: hasPremium1,
      onGenerate: onGeneratePremium1,
      previewPdf: PREMIUM1_PREVIEW_PDF,
    },
    {
      key: "premium2",
      label: "Premium 2",
      price: "₹100",
      color: VIOLET,
      version: 2,
      features: ["All Premium 1 features", "3D animations", "Custom theme", "Coming soon…"],
      locked: !hasPremium2,
      paid: hasPremium2,
      onGenerate: onGeneratePremium2,
      previewPdf: PREMIUM2_PREVIEW_PDF,
    },
  ];

  return (
    <>
      {/* ── PDF preview dialog ── */}
      <Dialog open={!!pdfUrl} onClose={() => setPdfUrl(null)} maxWidth="md" fullWidth>
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
          <IconButton onClick={() => setPdfUrl(null)}><MdClose /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0, height: "80vh" }}>
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Portfolio Preview"
          />
        </DialogContent>
      </Dialog>

      {/* ── Version Picker ── */}
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
          <IconButton onClick={onClose}><MdClose /></IconButton>
        </Box>

        <DialogContent>
          {payErr && <Alert severity="error" sx={{ mb: 2 }}>{payErr}</Alert>}
          {payOk  && <Alert severity="success" sx={{ mb: 2 }}>{payOk}</Alert>}

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
                {/* paid badge */}
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

                {/* name + price */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {plan.key !== "free" && (
                    <MdStar style={{ color: GOLD, fontSize: 20 }} />
                  )}
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: plan.color }}>
                    {plan.label}
                  </Typography>
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  {plan.price}
                  {plan.key !== "free" && (
                    <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                      one-time
                    </Typography>
                  )}
                </Typography>

                {/* features */}
                <Box sx={{ flex: 1 }}>
                  {plan.features.map((f) => (
                    <Typography key={f} variant="body2" sx={{ py: 0.25 }}>
                      ✓ {f}
                    </Typography>
                  ))}
                </Box>

                {/* eye icon — preview PDF */}
                {plan.previewPdf && (
                  <Tooltip title="Preview layout PDF">
                    <IconButton
                      size="small"
                      sx={{ alignSelf: "flex-start", color: plan.color }}
                      onClick={() => setPdfUrl(plan.previewPdf)}
                    >
                      <MdVisibility />
                    </IconButton>
                  </Tooltip>
                )}

                {/* action button */}
                {plan.paid ? (
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
                  <Button
                    variant="outlined"
                    fullWidth
                    disabled={paying !== null}
                    startIcon={
                      paying === plan.version ? (
                        <CircularProgress size={14} />
                      ) : (
                        <MdLock />
                      )
                    }
                    onClick={() => handlePay(plan.version)}
                    sx={{
                      mt: 1,
                      borderRadius: 999,
                      fontWeight: 800,
                      borderColor: plan.color,
                      color: plan.color,
                    }}
                  >
                    {paying === plan.version ? "Processing…" : `Pay & Unlock`}
                  </Button>
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}