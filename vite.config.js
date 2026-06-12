import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

function normalizeBackendUrl(value) {
  const trimmed = String(value ?? "").trim().replace(/\/+$/, "");

  if (!trimmed) return DEFAULT_BACKEND_URL;
  if (trimmed.endsWith("/api")) return trimmed.slice(0, -4);

  return trimmed;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = normalizeBackendUrl(env.VITE_BACKEND_URL);

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
        },
        "/media": {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
