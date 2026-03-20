// frontend/src/components/VersionPickerModal.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Dialog, DialogContent, Box, Typography, Button,
  Chip, CircularProgress, Alert, IconButton, Tooltip,
  TextField, MenuItem, Select, InputLabel, FormControl,
} from "@mui/material";
import {
  MdClose, MdVisibility, MdLock, MdCheckCircle, MdStar,
  MdArrowBack, MdQrCode2, MdSend,
} from "react-icons/md";

const BACKEND_BASE = (
  import.meta.env.VITE_API_URL ||
  "https://db-driven-portfolio-generator-multiuser-pq34.onrender.com/api"
).replace(/\/api\/?$/, "");
const API_BASE = `${BACKEND_BASE}/api`;

const BRAND  = "#7a3f91";
const GOLD   = "#f59e0b";
const VIOLET = "#7c3aed";

// ── Step constants ──────────────────────────────────────────────────────────
const STEP_PICKER   = "picker";   // main plan cards
const STEP_QR       = "qr";       // UPI QR + pay options
const STEP_FORM     = "form";     // "I've Paid" form

export default function VersionPickerModal({
  open,
  onClose,
  hasPremium1: hasPremium1Prop,
  hasPremium2: hasPremium2Prop,
  username,
  onPremiumUnlocked,
  onGenerateFree,
  onGeneratePremium1,
  onGeneratePremium2,
}) {
  const [step, setStep]       = useState(STEP_PICKER);
  const [activeVersion, setActiveVersion] = useState(null); // 1 | 2
  const [payErr, setPayErr]   = useState("");
  const [payOk, setPayOk]     = useState("");
  const [pdfUrl, setPdfUrl]   = useState(null);

  // Live premium status — re-fetched every time modal opens
  const [hasPremium1, setHasPremium1] = useState(hasPremium1Prop);
  const [hasPremium2, setHasPremium2] = useState(hasPremium2Prop);
  const [premiumLoading, setPremiumLoading] = useState(false);

  // ── Preview PDF URLs ────────────────────────────────────────────────────
  const [previewPdfUrls, setPreviewPdfUrls] = useState({ premium1: null, premium2: null });

  // ── UPI QR image URLs ───────────────────────────────────────────────────
  const [qrUrls, setQrUrls] = useState({ premium1: null, premium2: null });

  // ── "I've Paid" form state ──────────────────────────────────────────────
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    paymentId: "",
    paidVia: "",
    paidFromMobile: "",
  });
  const [formErr, setFormErr]       = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formDone, setFormDone]     = useState(false);

  // ── Sync prop changes into local state ─────────────────────────────────
  useEffect(() => {
    setHasPremium1(hasPremium1Prop);
    setHasPremium2(hasPremium2Prop);
  }, [hasPremium1Prop, hasPremium2Prop]);

  // ── Fetch live premium status ───────────────────────────────────────────
  const fetchPremiumLive = async () => {
    if (!username) return;
    const authUser = (localStorage.getItem("auth_user") || username || "").toLowerCase();

    // Step 1: read localStorage instantly
    const lsP1 = localStorage.getItem(`premium1_${authUser}`) === "true";
    const lsP2 = localStorage.getItem(`premium2_${authUser}`) === "true";
    if (lsP1) setHasPremium1(true);
    if (lsP2) setHasPremium2(true);

    // Always hit server — localStorage may be stale before approval
    setPremiumLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/payment-requests/status?username=${encodeURIComponent(authUser)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.ok) {
        const data = await res.json();
        // Backend always returns { hasPremium1: bool, hasPremium2: bool }
        const p1 = Boolean(data.hasPremium1) || lsP1;
        const p2 = Boolean(data.hasPremium2) || lsP2;
        setHasPremium1(p1);
        setHasPremium2(p2);
        if (p1) localStorage.setItem(`premium1_${authUser}`, "true");
        if (p2) localStorage.setItem(`premium2_${authUser}`, "true");
        // Only notify parent if something NEWLY became true (wasn't true in props before)
        const newlyP1 = p1 && !hasPremium1Prop;
        const newlyP2 = p2 && !hasPremium2Prop;
        if ((newlyP1 || newlyP2) && typeof onPremiumUnlocked === "function") {
          onPremiumUnlocked({ hasPremium1: p1, hasPremium2: p2 });
        }
      }
    } catch { /* silent */ }
    finally { setPremiumLoading(false); }
  };

  // ── Fetch preview PDFs + QR URLs on open ───────────────────────────────
  useEffect(() => {
    if (!open) return;
    fetchPremiumLive();

    const fetchPreviews = async () => {
      try {
        const [r1, r2] = await Promise.allSettled([
          fetch(`${API_BASE}/master-admin/preview-pdfs/latest/premium1`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE}/master-admin/preview-pdfs/latest/premium2`).then(r => r.ok ? r.json() : null),
        ]);
        setPreviewPdfUrls({
          premium1: r1.status === "fulfilled" && r1.value?.id ? `${API_BASE}/master-admin/preview-pdfs/${r1.value.id}/view` : null,
          premium2: r2.status === "fulfilled" && r2.value?.id ? `${API_BASE}/master-admin/preview-pdfs/${r2.value.id}/view` : null,
        });
      } catch { /* leave null */ }
    };

const checkQr = () => {
      // Set URLs directly — endpoints are permitAll, no HEAD check needed
      setQrUrls({
        premium1: `${API_BASE}/upi-qr/premium1/view?t=${Date.now()}`,
        premium2: `${API_BASE}/upi-qr/premium2/view?t=${Date.now()}`,
      });
    };

    fetchPreviews();
    checkQr();
  }, [open]);

  // ── Reset to picker when modal closes ──────────────────────────────────
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(STEP_PICKER);
        setActiveVersion(null);
        setPayErr("");
        setPayOk("");
        setFormDone(false);
        setForm({ fullName: "", phone: "", paymentId: "", paidVia: "", paidFromMobile: "" });
        setFormErr("");
      }, 300);
    }
  }, [open]);

  // ── Open UPI QR step ────────────────────────────────────────────────────
  const handlePayAndUnlock = (version) => {
    setActiveVersion(version);
    setPayErr("");
    setPayOk("");
    setFormDone(false);
    setForm({ fullName: "", phone: "", paymentId: "", paidVia: `premium${version}`, paidFromMobile: "" });
    setFormErr("");
    setStep(STEP_QR);
  };

  // ── Submit "I've Paid" form ─────────────────────────────────────────────
  const handleFormSubmit = async () => {
    const { fullName, phone, paymentId, paidVia, paidFromMobile } = form;
    if (!fullName.trim() || !phone.trim() || !paymentId.trim() || !paidVia.trim() || !paidFromMobile.trim()) {
      setFormErr("All fields are required.");
      return;
    }
    setFormErr("");
    setFormSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/payment-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          fullName: fullName.trim(),
          phone: phone.trim(),
          paymentId: paymentId.trim(),
          paidVia: paidVia.trim(),
          paidFromMobile: paidFromMobile.trim(),
          version: activeVersion,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFormDone(true);
      // Poll every 5s using the correct endpoint
      const authUserForPoll = (localStorage.getItem("auth_user") || username || "").toLowerCase();
      const pollInterval = setInterval(async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(
            `${API_BASE}/payment-requests/status?username=${encodeURIComponent(authUserForPoll)}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
          if (res.ok) {
            const data = await res.json();
            // Backend always returns { hasPremium1: bool, hasPremium2: bool }
            const p1 = Boolean(data.hasPremium1) || localStorage.getItem(`premium1_${authUserForPoll}`) === "true";
            const p2 = Boolean(data.hasPremium2) || localStorage.getItem(`premium2_${authUserForPoll}`) === "true";
            if ((activeVersion === 1 && p1) || (activeVersion === 2 && p2)) {
              setHasPremium1(p1);
              setHasPremium2(p2);
              if (p1) localStorage.setItem(`premium1_${authUserForPoll}`, "true");
              if (p2) localStorage.setItem(`premium2_${authUserForPoll}`, "true");
              if (typeof onPremiumUnlocked === "function") {
                onPremiumUnlocked({ hasPremium1: p1, hasPremium2: p2 });
              }
              clearInterval(pollInterval);
            }
          }
        } catch { /* silent */ }
      }, 5000);
      // Stop polling after 10 min
      setTimeout(() => clearInterval(pollInterval), 600000);
    } catch (e) {
      setFormErr("Submission failed: " + e.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Plans config ────────────────────────────────────────────────────────
  const plans = [
    {
      key: "free", label: "Free", price: "₹0", color: "#16a34a",
      features: ["Basic layout", "All your data", "Public URL"],
      locked: false, paid: true,
      onGenerate: onGenerateFree, previewPdf: null,
    },
    {
      key: "premium1", label: "Premium 1", price: "₹50", color: BRAND,
      version: 1,
      features: ["Luxury card design", "Animated sections", "Holographic effects", "Priority layout"],
      locked: !hasPremium1, paid: hasPremium1,
      onGenerate: onGeneratePremium1, previewPdf: previewPdfUrls.premium1,
    },
    {
      key: "premium2", label: "Premium 2", price: "₹100", color: VIOLET,
      version: 2,
      features: ["All Premium 1 features", "3D animations", "Custom theme", "Coming soon…"],
      locked: !hasPremium2, paid: hasPremium2,
      onGenerate: onGeneratePremium2, previewPdf: previewPdfUrls.premium2,
    },
  ];

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const getPdfSrc = (url) => !url ? "" : isMobile
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
    : `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

  const activePlan = plans.find(p => p.version === activeVersion);

  // ════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* PDF preview dialog */}
      <Dialog open={!!pdfUrl} onClose={() => setPdfUrl(null)} maxWidth="md" fullWidth>
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
          <IconButton onClick={() => setPdfUrl(null)}><MdClose /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0, height: "80vh" }}>
          {pdfUrl && <iframe src={getPdfSrc(pdfUrl)} style={{ width: "100%", height: "100%", border: "none" }} title="Portfolio Preview" />}
        </DialogContent>
      </Dialog>

      {/* Main modal */}
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, pt: 2.5, pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {step !== STEP_PICKER && (
              <IconButton size="small" onClick={() => setStep(step === STEP_FORM ? STEP_QR : STEP_PICKER)} sx={{ mr: 0.5 }}>
                <MdArrowBack />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {step === STEP_PICKER && "Choose Your Portfolio Version"}
              {step === STEP_QR && `Pay for Premium ${activeVersion}`}
              {step === STEP_FORM && "Payment Confirmation"}
            </Typography>
          </Box>
          <IconButton onClick={onClose}><MdClose /></IconButton>
        </Box>

        <DialogContent sx={{ pt: 1 }}>

          {/* ── STEP: PICKER ───────────────────────────────────────────── */}
          {step === STEP_PICKER && (
            <>
              {payErr && <Alert severity="error" sx={{ mb: 2 }}>{payErr}</Alert>}
              {payOk  && <Alert severity="success" sx={{ mb: 2 }}>{payOk}</Alert>}
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: "stretch" }}>
                {plans.map((plan) => (
                  <Box
                    key={plan.key}
                    sx={{
                      flex: 1, border: `2px solid ${plan.paid ? plan.color : "rgba(0,0,0,0.12)"}`,
                      borderRadius: 3, p: 2.5, display: "flex", flexDirection: "column", gap: 1,
                      position: "relative",
                      background: plan.paid ? `linear-gradient(135deg, ${plan.color}10, transparent)` : "transparent",
                      transition: "box-shadow 0.2s",
                      "&:hover": { boxShadow: `0 4px 24px ${plan.color}30` },
                    }}
                  >
                    {plan.paid && plan.key !== "free" && (
                      <Chip icon={<MdCheckCircle />} label="Unlocked" size="small" sx={{ position: "absolute", top: 12, right: 12, bgcolor: plan.color, color: "#fff", fontWeight: 700, "& .MuiChip-icon": { color: "#fff" } }} />
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {plan.key !== "free" && <MdStar style={{ color: GOLD, fontSize: 20 }} />}
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: plan.color }}>{plan.label}</Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>
                      {plan.price}
                      {plan.key !== "free" && <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>one-time</Typography>}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      {plan.features.map((f) => <Typography key={f} variant="body2" sx={{ py: 0.25 }}>✓ {f}</Typography>)}
                    </Box>

                    {plan.key !== "free" && (
                      plan.previewPdf
                        ? <Tooltip title="Preview layout PDF"><IconButton size="small" sx={{ alignSelf: "flex-start", color: plan.color }} onClick={() => setPdfUrl(plan.previewPdf)}><MdVisibility /></IconButton></Tooltip>
                        : <Typography variant="caption" sx={{ opacity: 0.4, fontSize: "0.7rem", alignSelf: "flex-start" }}>No preview available</Typography>
                    )}

                    {plan.paid ? (
                      <Button variant="contained" fullWidth onClick={plan.onGenerate} sx={{ mt: 1, borderRadius: 999, fontWeight: 800, background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` }}>
                        Generate {plan.label}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined" fullWidth
                        startIcon={<MdLock />}
                        onClick={() => handlePayAndUnlock(plan.version)}
                        sx={{ mt: 1, borderRadius: 999, fontWeight: 800, borderColor: plan.color, color: plan.color }}
                      >
                        Pay &amp; Unlock
                      </Button>
                    )}
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* ── STEP: QR ───────────────────────────────────────────────── */}
          {step === STEP_QR && activePlan && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, py: 1 }}>

              {/* QR image */}
              <Box sx={{
                p: 2, borderRadius: 3, border: `2px solid ${activePlan.color}40`,
                background: `linear-gradient(135deg, ${activePlan.color}08, transparent)`,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5,
                width: "100%", maxWidth: 340,
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MdQrCode2 style={{ color: activePlan.color, fontSize: 22 }} />
                  <Typography sx={{ fontWeight: 800, color: activePlan.color }}>
                    Scan &amp; Pay {activePlan.price}
                  </Typography>
                </Box>

                {qrUrls[activePlan.key] ? (
                  <Box
                    component="img"
                    src={`${qrUrls[activePlan.key]}?t=${Date.now()}`}
                    alt="UPI QR Code"
                    sx={{ width: 220, height: 220, objectFit: "contain", borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)", background: "#fff", p: 1 }}
                  />
                ) : (
                  <Box sx={{ width: 220, height: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 2, border: "1px dashed rgba(0,0,0,0.18)", gap: 1 }}>
                    <MdQrCode2 style={{ fontSize: 48, opacity: 0.25 }} />
                    <Typography variant="caption" sx={{ opacity: 0.5, textAlign: "center" }}>QR not uploaded yet.<br />Contact support.</Typography>
                  </Box>
                )}

                <Typography variant="caption" sx={{ opacity: 0.6, textAlign: "center" }}>
                  Pay ₹{activePlan.price.replace("₹", "")} using any UPI app
                </Typography>
              </Box>

              {/* Pay via Razorpay — coming soon */}
              <Button
                variant="outlined" fullWidth
                sx={{ borderRadius: 999, fontWeight: 800, maxWidth: 340, borderColor: activePlan.color, color: activePlan.color }}
                onClick={() => {
                  // coming soon popup
                  setPayErr("");
                  setPayOk("🚀 Razorpay integration coming soon!");
                }}
              >
                Pay via Razorpay
              </Button>
              {payOk && <Alert severity="info" sx={{ width: "100%", maxWidth: 340 }}>{payOk}</Alert>}

              {/* I've Paid button */}
              <Button
                variant="contained" fullWidth
                sx={{ borderRadius: 999, fontWeight: 800, maxWidth: 340, background: `linear-gradient(135deg, ${activePlan.color}, ${activePlan.color}cc)` }}
                onClick={() => { setPayOk(""); setStep(STEP_FORM); }}
              >
                ✅ I've Paid — Submit Details
              </Button>
            </Box>
          )}

          {/* ── STEP: FORM ─────────────────────────────────────────────── */}
          {step === STEP_FORM && activePlan && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, py: 1, maxWidth: 480, mx: "auto" }}>

              {formDone ? (
                /* ── Success state ── */
              <Box sx={{ textAlign: "center", py: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <Box sx={{ fontSize: 64 }}>🎉</Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>Request Submitted!</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7, maxWidth: 340 }}>
                    Your payment details have been sent for review. Once approved, your <strong>Premium {activeVersion}</strong> portfolio will be unlocked automatically.
                  </Typography>
                  {/* Show Generate button if already approved */}
                  {((activeVersion === 1 && hasPremium1) || (activeVersion === 2 && hasPremium2)) ? (
                    <Button
                      variant="contained"
                      sx={{ borderRadius: 999, mt: 1, fontWeight: 800, background: `linear-gradient(135deg, ${activePlan.color}, ${activePlan.color}cc)` }}
                      onClick={activeVersion === 1 ? onGeneratePremium1 : onGeneratePremium2}
                    >
                      ✅ Generate Premium {activeVersion} Now
                    </Button>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, opacity: 0.6, fontSize: 13 }}>
                        {premiumLoading ? <CircularProgress size={14} /> : null}
                        <Typography variant="caption">Waiting for approval…</Typography>
                      </Box>
                      <Button
                        variant="outlined" size="small"
                        sx={{ borderRadius: 999, borderColor: activePlan.color, color: activePlan.color }}
                        onClick={fetchPremiumLive}
                        startIcon={premiumLoading ? <CircularProgress size={12} color="inherit" /> : null}
                      >
                        Check Status
                      </Button>
                    </Box>
                  )}
                  <Button variant="outlined" sx={{ borderRadius: 999, borderColor: "rgba(0,0,0,0.2)", color: "text.secondary" }} onClick={onClose}>
                    Close
                  </Button>
                </Box>
              ) : (
                <>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Fill in your payment details. All fields are required. Our team will verify and unlock your premium access.
                  </Typography>

                  {formErr && <Alert severity="error">{formErr}</Alert>}

                  <TextField
                    label="Full Name"
                    size="small"
                    fullWidth
                    required
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    helperText="As per your profile / registration"
                  />

                  <TextField
                    label="Your Phone Number"
                    size="small"
                    fullWidth
                    required
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    inputProps={{ inputMode: "tel" }}
                  />

                  <TextField
                    label="Payment / Transaction ID"
                    size="small"
                    fullWidth
                    required
                    value={form.paymentId}
                    onChange={e => setForm(f => ({ ...f, paymentId: e.target.value }))}
                    helperText="From your UPI app after payment"
                  />

                  <FormControl size="small" fullWidth required>
                    <InputLabel>Paid Via</InputLabel>
                    <Select
                      value={form.paidVia}
                      label="Paid Via"
                      onChange={e => setForm(f => ({ ...f, paidVia: e.target.value }))}
                    >
                      <MenuItem value="Google Pay">Google Pay</MenuItem>
                      <MenuItem value="PhonePe">PhonePe</MenuItem>
                      <MenuItem value="Paytm">Paytm</MenuItem>
                      <MenuItem value="BHIM UPI">BHIM UPI</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Paid From Mobile Number"
                    size="small"
                    fullWidth
                    required
                    value={form.paidFromMobile}
                    onChange={e => setForm(f => ({ ...f, paidFromMobile: e.target.value }))}
                    helperText="Mobile number linked to your UPI"
                    inputProps={{ inputMode: "tel" }}
                  />

                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${activePlan.color}10`, border: `1px solid ${activePlan.color}30` }}>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      <strong>Version:</strong> Premium {activeVersion} — {activePlan.price}&nbsp;&nbsp;|&nbsp;&nbsp;
                      <strong>Username:</strong> {username}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={formSubmitting}
                    startIcon={formSubmitting ? <CircularProgress size={16} color="inherit" /> : <MdSend />}
                    onClick={handleFormSubmit}
                    sx={{ borderRadius: 999, fontWeight: 800, background: `linear-gradient(135deg, ${activePlan.color}, ${activePlan.color}cc)` }}
                  >
                    {formSubmitting ? "Submitting…" : "Submit Payment Details"}
                  </Button>
                </>
              )}
            </Box>
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}