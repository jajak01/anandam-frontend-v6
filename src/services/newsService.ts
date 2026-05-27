import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const newsService = {
  // Public API
  getPublicNews: async (params: any) => {
    const response = await axios.get(`${API_URL}/public/news`, { params });
    return response.data;
  },

  getNewsBySlug: async (slug: string) => {
    const response = await axios.get(`${API_URL}/public/news/slug/${slug}`);
    return response.data;
  },

  // Admin API
  getAdminNews: async (params: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/admin/news`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getAdminNewsById: async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/admin/news/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  createNews: async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/admin/news`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateNews: async (id: string, formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/admin/news/${id}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  deleteNews: async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/admin/news/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

export default newsService;
