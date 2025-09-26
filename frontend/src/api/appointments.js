// src/api/appointments.js
import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const URL  = `${BASE}/appointments`;

// ADD: read token from BOTH localStorage and sessionStorage (your Login stores in one or the other)
const getStoredToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token") ||            // ADD
  localStorage.getItem("auth_token") ||         // ADD (you also save under this key)
  sessionStorage.getItem("auth_token");         // ADD

const authHeaders = () => {
  // CHANGE: use getStoredToken() so "Remember me" off still works
  const token = getStoredToken();               // CHANGE
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const ApptAPI = {
  // CHANGE: list() should call /appointments/my so it only returns the current user's appointments
  list: async (params = {}) => {                // (params kept in case you add filters like ?status=)
    const { data } = await axios.get(`${URL}/my`, { // CHANGE
      params,
      headers: authHeaders(),
      withCredentials: true,                    // ADD (if you ever move tokens to HttpOnly cookies)
    });
    // /appointments/my returns an array (controller sends plain list)
    return Array.isArray(data) ? data : data?.appointments || [];
  },

  // Get one (controller enforces owner-or-admin)
  get: async (id) => {
    const { data } = await axios.get(`${URL}/${id}`, {
      headers: authHeaders(),
      withCredentials: true,                    // ADD
    });
    return data?.appointment || data;
  },

  // Create (owner set on backend from JWT; client doesn't send userId)
  create: async (payload) => {
    const { data } = await axios.post(URL, payload, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      withCredentials: true,                    // ADD
    });
    return data?.appointment || data;
  },

  // Update
  update: async (id, payload) => {
    const { data } = await axios.patch(`${URL}/${id}`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      withCredentials: true,                    // ADD
    });
    return data?.appointment || data;
  },

  // Delete
  remove: async (id) => {
    const { data } = await axios.delete(`${URL}/${id}`, {
      headers: authHeaders(),
      withCredentials: true,                    // ADD
    });
    return data;
  },
};
