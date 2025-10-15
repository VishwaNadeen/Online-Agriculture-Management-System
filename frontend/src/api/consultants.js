// src/api/consultants.js
import api from "../utils/api";

export const ConsultantAPI = {
  // Logged-in consultant profile
  getMe: async () => {
    const { data } = await api.get("/consultants/me");
    return data;
  },
  // Public by ID (admin can also use this)
  getById: async (id) => {
    const { data } = await api.get(`/consultants/${id}`);
    return data;
  },
  // Lightweight list (cards)
  list: async (params = {}) => {
    const { data } = await api.get("/consultants", { params });
    return data?.items || [];
  },
};

export default ConsultantAPI;
