// src/api/appointments.js
import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const URL  = `${BASE}/appointments`;

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const ApptAPI = {
  // List with optional filters (e.g., ?q=, ?city=)
  list: async (params = {}) => {
    const { data } = await axios.get(URL, { params, headers: authHeaders() });
    return Array.isArray(data) ? data : data?.appointments || [];
  },

  // Get one
  get: async (id) => {
    const { data } = await axios.get(`${URL}/${id}`, { headers: authHeaders() });
    return data?.appointment || data;
  },

  // Create
  create: async (payload) => {
    const { data } = await axios.post(URL, payload, { headers: { "Content-Type": "application/json", ...authHeaders() } });
    return data?.appointment || data;
  },

  // Update
  update: async (id, payload) => {
    const { data } = await axios.put(`${URL}/${id}`, payload, { headers: { "Content-Type": "application/json", ...authHeaders() } });
    return data?.appointment || data;
  },

  // Delete
  remove: async (id) => {
    const { data } = await axios.delete(`${URL}/${id}`, { headers: authHeaders() });
    return data;
  },
};
