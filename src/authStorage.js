const ACCESS_TOKEN_KEYS = ["accessToken", "token"];
const REFRESH_TOKEN_KEY = "refreshToken";

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("authchange"));
  }
}

function decodeJwtPayload(token) {
  const payload = String(token ?? "").split(".")[1];
  if (!payload) return null;

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(paddedPayload));
  } catch {
    return null;
  }
}

export function isExpiredJwt(token) {
  if (typeof window === "undefined") return false;

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;

  return Date.now() >= Number(payload.exp) * 1000;
}

export function getStoredAccessToken() {
  if (typeof localStorage === "undefined") return "";

  return ACCESS_TOKEN_KEYS
    .map((key) => localStorage.getItem(key))
    .find((token) => token && !isExpiredJwt(token)) ?? "";
}

export function storeAuthTokens(tokens) {
  if (tokens?.access) {
    localStorage.setItem("accessToken", tokens.access);
    localStorage.setItem("token", tokens.access);
  }

  if (tokens?.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }

  notifyAuthChange();
}

export function clearAuthTokens() {
  ACCESS_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  notifyAuthChange();
}

export function hasStoredAuthToken() {
  return Boolean(getStoredAccessToken());
}
