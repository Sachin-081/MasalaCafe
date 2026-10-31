
import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  async function login(credentials, role = "student") {
    setLoading(true);

    try {
      const endpoint =
        role === "admin"
          ? "/api/auth/admin/login"
          : role === "kitchen"
            ? "/api/auth/kitchen/login"
            : "/api/auth/login";

      const response = await api.post(endpoint, credentials);

      const loggedInUser = response.student;
      if (!response.access_token || !loggedInUser) {
        throw new Error("The server returned an incomplete authentication response.");
      }

      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      setUser(loggedInUser);

      return loggedInUser;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// The provider and its hook intentionally share this context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
