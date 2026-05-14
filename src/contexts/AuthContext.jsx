import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // 🔐 GET CURRENT USER FROM BACKEND
 const fetchUser = async () => {
  const token = localStorage.getItem("token"); // IMPORTANT FIX

  if (!token) {
    setUser(null);
    setLoading(false);
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:5001/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) throw new Error("failed");

    setUser(data);
  } catch (err) {
    setUser(null);
    localStorage.removeItem("token");
  } finally {
    setLoading(false);
  }
};

  // 🔐 AUTO LOGIN ON REFRESH
  useEffect(() => {
    if (token) fetchUser();
    else setLoading(false);
  }, []);

  // 🔐 LOGIN
  const login = (token) => {
    localStorage.setItem("token", token);
    fetchUser();
  };

  // 🔐 LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

