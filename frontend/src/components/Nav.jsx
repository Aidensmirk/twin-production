import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = [
  { to: "/home", label: "Home" },
  { to: "/insights", label: "Insights" },
  { to: "/history", label: "History" },
  { to: "/privacy", label: "Privacy" },
  { to: "/account", label: "Account" },
];

export default function Nav({ minimal = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-fg/10 flex-wrap gap-3">
      <div
        className="font-serif text-[19px] font-semibold tracking-wide cursor-pointer"
        onClick={() => navigate("/home")}
      >
        TWIN<span className="text-twin">·</span>
      </div>
      {!minimal && (
        <div className="flex gap-1">
          {LINKS.map((l) => (
            <button
              key={l.to}
              onClick={() => navigate(l.to)}
              className={`px-3.5 py-2 rounded-sm text-[13.5px] transition-colors ${
                location.pathname === l.to
                  ? "text-fg bg-bg-elevated"
                  : "text-fg-dim hover:text-fg hover:bg-bg-elevated"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
      {minimal && (
        <button
          onClick={() => navigate("/home")}
          className="px-3.5 py-2 rounded-sm text-[13.5px] text-fg-dim hover:text-fg"
        >
          Exit
        </button>
      )}
      {!minimal && (
        <button
          onClick={handleLogout}
          className="px-3.5 py-2 rounded-sm text-[13.5px] text-fg-dim hover:text-fg hover:bg-bg-elevated transition-colors"
        >
          Log out
        </button>
      )}
    </div>
  );
}
