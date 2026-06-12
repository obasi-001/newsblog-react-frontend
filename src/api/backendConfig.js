const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

function trimTrailingSlashes(value) {
  return String(value ?? "").trim().replace(/\/+$/, "");
}

function normalizeBackendUrl(value) {
  const trimmed = trimTrailingSlashes(value) || DEFAULT_BACKEND_URL;

  if (trimmed.endsWith("/api")) {
    return trimmed.slice(0, -4);
  }

  return trimmed;
}

export const BACKEND_BASE_URL = normalizeBackendUrl(
  import.meta.env.VITE_BACKEND_URL,
);

export const API_BASE_URL = `${BACKEND_BASE_URL}/api/`;

export function resolveBackendUrl(path) {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;

  return `${BACKEND_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
