// src/api/http.js
import axios from "axios";

/*
  Uses production backend on Render.
  Falls back to localhost for local dev.
*/

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://db-driven-portfolio-generator-multiuser-pq34.onrender.com/api";

// axios instance
const http = axios.create({
  baseURL,
});

// ================= REQUEST INTERCEPTOR =================
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE INTERCEPTOR =================
http.interceptors.response.use(
  (res) => res,
  (error) => {
    const requestURL = error?.config?.url || "";
    const status     = error?.response?.status;

    // ── Never redirect on login / register failures ──────────────────────
    const isAuthRequest =
      requestURL.includes("/auth/login") ||
      requestURL.includes("/auth/register");

    // ── Never redirect on payment endpoints (skip-unlock, status, verify) ─
    const isPaymentRequest = requestURL.includes("/payment/");

    // ── Only redirect when the user is actually on an admin page ─────────
    // This prevents public viewer pages from being kicked to login when
    // they hit a 401 on a public-ish endpoint.
    const isAdminPage = window.location.pathname.includes("/adminpanel");

    if (
      status === 401 &&
      !isAuthRequest &&
      !isPaymentRequest &&
      isAdminPage
    ) {
      localStorage.removeItem("token");
      sessionStorage.clear();
      window.location.href = "/adminpanel/login";
    }

    return Promise.reject(error);
  }
);

export default http;