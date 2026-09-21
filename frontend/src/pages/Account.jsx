import React from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Account() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <Nav />
      <main className="max-w-[640px] mx-auto px-6 py-14">
        <div className="text-fg-faint text-[12.5px] mb-2 tracking-wide">account</div>
        <h1 className="font-serif text-[26px] font-medium mb-2">Your account</h1>
        <p className="text-fg-dim text-[15.5px] mb-8">
          Your identity and Twin progress, in one place.
        </p>

        <section className="bg-bg-elevated border border-fg/10 rounded-sm p-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-fg-faint text-[12px] tracking-wide mb-1">username</div>
              <div className="text-[17px]">{profile?.username || "—"}</div>
            </div>
            <div className="text-right">
              <div className="text-fg-faint text-[12px] tracking-wide mb-1">status</div>
              <div className="text-twin text-[13.5px]">
                {profile?.onboarded ? "Twin active" : "Onboarding"}
              </div>
            </div>
          </div>
          <div className="border-t border-fg/10 mt-5 pt-4">
            <div className="text-fg-faint text-[12px] tracking-wide mb-1">email</div>
            <div className="text-[14px] text-fg-dim">{profile?.email || "No email added"}</div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 mb-8">
          <div className="border border-fg/10 rounded-sm p-5">
            <div className="font-serif text-[30px] font-medium tabular-nums">{profile?.streak ?? 0}</div>
            <div className="text-fg-dim text-[12.5px] mt-1">current streak</div>
          </div>
          <div className="border border-fg/10 rounded-sm p-5">
            <div className="font-serif text-[30px] font-medium tabular-nums">{profile?.best_streak ?? 0}</div>
            <div className="text-fg-dim text-[12.5px] mt-1">best streak</div>
          </div>
        </section>

        <div className="border-t border-fg/10 pt-6">
          <button className="btn-ghost" onClick={handleLogout}>
            Log out of TWIN
          </button>
        </div>
      </main>
    </div>
  );
}
