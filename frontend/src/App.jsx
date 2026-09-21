import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Home from "./pages/Home.jsx";
import PredictionRoom from "./pages/PredictionRoom.jsx";
import Reveal from "./pages/Reveal.jsx";
import Insights from "./pages/Insights.jsx";
import History from "./pages/History.jsx";
import Privacy from "./pages/Privacy.jsx";
import Account from "./pages/Account.jsx";

function Protected({ children }) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="max-w-[640px] mx-auto px-6 py-16 text-fg-dim">Loading…</div>;
  if (!profile) return <Navigate to="/login" replace />;
  if (!profile.onboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/onboarding"
        element={
          <Protected>
            <Onboarding />
          </Protected>
        }
      />
      <Route
        path="/home"
        element={
          <Protected>
            <Home />
          </Protected>
        }
      />
      <Route
        path="/round"
        element={
          <Protected>
            <PredictionRoom />
          </Protected>
        }
      />
      <Route
        path="/reveal"
        element={
          <Protected>
            <Reveal />
          </Protected>
        }
      />
      <Route
        path="/insights"
        element={
          <Protected>
            <Insights />
          </Protected>
        }
      />
      <Route
        path="/history"
        element={
          <Protected>
            <History />
          </Protected>
        }
      />
      <Route
        path="/privacy"
        element={
          <Protected>
            <Privacy />
          </Protected>
        }
      />
      <Route
        path="/account"
        element={
          <Protected>
            <Account />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
