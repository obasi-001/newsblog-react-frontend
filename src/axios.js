import axios from "axios";
import { API_BASE_URL } from "./api/backendConfig";

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((reg) => {
  const token =
    localStorage.getItem("accessToken") ?? localStorage.getItem("token");

  if (token) {
    reg.headers.Authorization = `Bearer ${token}`;
  }

  return reg;
});

export default API;
