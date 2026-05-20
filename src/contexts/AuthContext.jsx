import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, {
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
} from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function validateToken() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.get("/auth/me");
        setUser(data.user);
        setStoredUser(data.user);
      } catch {
        removeToken();
        removeStoredUser();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, []);

  async function signup(email, password, home_currency = "KES", turnstileToken = null) {
    const payload = {
      email,
      password,
      home_currency,
    };
    if (turnstileToken) {
      payload.turnstile_token = turnstileToken;
    }
    const data = await api.post("/auth/signup", payload);
    setToken(data.access_token);
    setStoredUser(data.user);
    setUser(data.user);
    navigate("/");
    return data;
  }

  async function login(email, password, turnstileToken = null) {
    const payload = { email, password };
    if (turnstileToken) {
      payload.turnstile_token = turnstileToken;
    }
    const data = await api.post("/auth/login", payload);
    setToken(data.access_token);
    setStoredUser(data.user);
    setUser(data.user);
    navigate("/");
    return data;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout API errors
    }
    removeToken();
    removeStoredUser();
    setUser(null);
    navigate("/login");
  }

  function updateUser(updatedUser) {
    setUser(updatedUser);
    setStoredUser(updatedUser);
  }

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
