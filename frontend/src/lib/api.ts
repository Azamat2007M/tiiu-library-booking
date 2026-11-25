import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("library_jwt_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (typeof window !== "undefined") {
        if (!window.location.pathname.startsWith("/login")) {
          localStorage.removeItem("library_jwt_token");
          localStorage.removeItem("library_user");
          window.location.href = `/login?redirect=${encodeURIComponent(
            window.location.pathname + window.location.search
          )}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
