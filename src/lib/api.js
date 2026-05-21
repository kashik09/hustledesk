// Production URL - hardcoded as primary, env var as override
const PROD_API_URL = "https://hustledesk-api-9qwl.onrender.com/api";
const DEV_API_URL = "http://localhost:5000/api";

const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? DEV_API_URL : PROD_API_URL);

// Debug: Log configured API URL at startup
if (typeof window !== "undefined") {
  console.log("[API] Mode:", import.meta.env.MODE);
  console.log("[API] URL:", API_URL);
}

const TOKEN_KEY = "hd_token";
const USER_KEY = "hd_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeStoredUser() {
  localStorage.removeItem(USER_KEY);
}

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request(method, path, body = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    config.body = JSON.stringify(body);
  }

  const url = `${API_URL}${path}`;

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.error || data.msg || "Request failed"
      );
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network error - provide more context
    console.error(`[API] Request failed: ${method} ${url}`, err);
    throw new ApiError(0, `Network error: Unable to reach server. Please check your connection.`);
  }
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};

export default api;
