import axios from "axios";
import { initIdleTimer } from "./idleTimer";

const isDev = import.meta.env.DEV;

const api = axios.create({
  baseURL: isDev ? '/api-marketplace/api/v1' : `${import.meta.env.VITE_API_BASE}/api/v1`,
  timeout: 20000,
});

// ================= GLOBAL STATE =================
let isRedirecting = false;
let isRefreshing = false; 
let failedQueue: any[] = []; 

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ================= REQUEST =================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ================= RESPONSE =================
api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const originalRequest = error.config || {};

    if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    // ================= SERVER DOWN / TIMEOUT HANDLER =================
    const isNetworkError = !error.response || error.code === "ERR_NETWORK";
    const isTimeout = error.code === "ECONNABORTED";

    if (isNetworkError || isTimeout) {
      if (!originalRequest._retryNetwork) {
        originalRequest._retryNetwork = true;
        console.warn("⚠️ Server lambat/tidak merespon, mencoba ulang dalam 3 detik...");
        
        await new Promise((res) => setTimeout(res, 3000)); 
        return api(originalRequest);
      }

      const isGetMethod = originalRequest.method?.toLowerCase() === 'get';

      if (isGetMethod) {
        const isAdminPanel = window.location.pathname.startsWith("/ayamgoreng");

        if (isAdminPanel) {
          console.error("🚨 Gagal memuat ulang data di background. Menggagalkan redirect supaya halaman admin tidak ter-refresh.");
        } else {
          console.error("🚨 SERVER DOWN / MATI TOTAL saat load data. Mengalihkan halaman...");
          if (!isRedirecting) {
            isRedirecting = true;
            window.location.href = "/server-busy";
          }
        }
      }

      return Promise.reject(error);
    }

    // ================= TOKEN EXPIRED (401 HANDLER) =================
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE}/api/v1/auth/refresh`,
          {
            refresh_token: refreshToken,
          }
        );

        const newAccessToken = res.data.access_token;
        const newRefreshToken = res.data.refresh_token;

        localStorage.setItem("token", newAccessToken);
        localStorage.setItem("refresh_token", newRefreshToken);

        initIdleTimer();

        isRefreshing = false;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (err) {
        isRefreshing = false;
        processQueue(err, null);
        
        localStorage.clear();
        window.location.href = "/ayamgoreng/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;