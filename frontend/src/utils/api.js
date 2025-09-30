// src/utils/api.js
import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  // If your backend sets/reads cookies too, uncomment:
  // withCredentials: true,
});

// Attach Authorization header automatically if a token exists
api.interceptors.request.use((config) => {
  const token =
  
    localStorage.getItem("auth_token") ||  
    localStorage.getItem("token") ||
    localStorage.getItem("user_token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("auth_token") ||
    sessionStorage.getItem("token");
    

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
