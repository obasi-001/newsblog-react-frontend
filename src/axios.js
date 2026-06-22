import axios from "axios";
import { API_BASE_URL } from "./api/backendConfig";
import { clearAuthTokens, getStoredAccessToken } from "./authStorage";

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((reg) => {
  const token = reg.skipAuth ? "" : getStoredAccessToken();

  if (token) {
    reg.headers.Authorization = `Bearer ${token}`;
  } else if (reg.headers?.Authorization) {
    delete reg.headers.Authorization;
  }

  return reg;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && getStoredAccessToken()) {
      clearAuthTokens();
    }

    return Promise.reject(error);
  },
);

export default API;
