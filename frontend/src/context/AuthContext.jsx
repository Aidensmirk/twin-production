import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setTokens, clearTokens } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null); // { username, onboarded, streak, best_streak, ... }
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const access = localStorage.getItem("twin_access");
    if (!access) {
      setProfile(null);
      setLoading(false);
      return null;
    }
    try {
      const res = await api.me();
      setProfile(res.data);
      return res.data;
    } catch (e) {
      clearTokens();
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  async function register(username, email, password) {
    const res = await api.register({ username, email, password });
    setTokens({ access: res.data.access, refresh: res.data.refresh });
    setProfile(res.data.profile);
    return res.data.profile;
  }

  async function login(username, password) {
    const res = await api.login({ username, password });
    setTokens({ access: res.data.access, refresh: res.data.refresh });
    const p = await refreshProfile();
    return p;
  }

  function logout() {
    clearTokens();
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{ profile, setProfile, loading, register, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
