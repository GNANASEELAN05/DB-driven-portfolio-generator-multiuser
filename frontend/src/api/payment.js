// frontend/src/api/payment.js
// ─────────────────────────────────────────────────
// Helpers to call backend payment endpoints and
// trigger Razorpay checkout in the browser.
// ─────────────────────────────────────────────────

import http from "./http";

/**
 * Load Razorpay JS SDK once.
 * Returns a promise that resolves when the script is ready.
 */
export function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
    document.body.appendChild(script);
  });
}

/**
 * Start a payment for the given premium version.
 *
 * @param {number}   version   – 1 or 2
 * @param {string}   username  – logged-in username (for display)
 * @param {Function} onSuccess – called with { hasPremium1, hasPremium2 } on success
 * @param {Function} onError   – called with error message string on failure
 */
export async function startPremiumPayment({ version, username, onSuccess, onError }) {
  try {
    const RazorpayClass = await loadRazorpay();

    // 1. Ask backend to create a Razorpay order
    const { data: order } = await http.post("/payment/create-order", { version });

    // 2. Open Razorpay checkout modal
    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Portfolio Generator",
      description: `Premium ${version} – ₹${version === 2 ? "100" : "50"}`,
      order_id: order.orderId,
      prefill: {
        name: username || "",
      },
      theme: { color: version === 2 ? "#7c3aed" : "#2563eb" },

      handler: async function (response) {
        try {
          // 3. Verify payment on backend
          const { data: verified } = await http.post("/payment/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            version: String(version),
          });

          if (verified.success) {
            onSuccess({ hasPremium1: verified.hasPremium1, hasPremium2: verified.hasPremium2 });
          } else {
            onError("Payment verified but unlock failed. Contact support.");
          }
        } catch (err) {
          onError(err?.response?.data || "Verification request failed");
        }
      },

      modal: {
        ondismiss: () => onError("Payment cancelled"),
      },
    };

    const rzp = new RazorpayClass(options);
    rzp.open();
  } catch (err) {
    onError(err?.response?.data || err?.message || "Payment failed");
  }
}

/**
 * Fetch current premium status for the logged-in user.
 * Returns { hasPremium1: bool, hasPremium2: bool }
 */
export async function fetchPremiumStatus() {
  try {
    const { data } = await http.get("/payment/status");
    return data;
  } catch {
    return { hasPremium1: false, hasPremium2: false };
  }
}