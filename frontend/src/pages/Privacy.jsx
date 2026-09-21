import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Nav from "../components/Nav.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const PRINCIPLES = [
  ["You are not your data.", "Your history is a partial record, not a verdict."],
  ["Consent first.", "The twin only learns from answers you give it directly, in this app."],
  ["No hidden inference.", "It never silently guesses sensitive traits and presents them as fact."],
  ["Server-locked predictions.", "Your Twin's guess is written to the database before your answer is accepted — the frontend can't fake or skip that order."],
  ["Your data, exportable and deletable.", "Use the controls below any time."],
];

export default function Privacy() {
  const { setProfile } = useAuth();
  const navigate = useNavigate();
  const [exported, setExported] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function exportData() {
    const res = await api.exportData();
    setExported(JSON.stringify(res.data, null, 2));
  }

  async function deleteEverything() {
    setBusy(true);
    try {
      await api.deleteData();
      setProfile((p) => ({ ...p, onboarded: false, onboarding_index: 0, streak: 0, best_streak: 0 }));
      navigate("/onboarding");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Nav />
      <div className="max-w-[640px] mx-auto px-6 py-14">
        <h2 className="font-serif text-[22px] font-medium mb-1">Privacy</h2>
        <p className="text-fg-dim text-[15.5px] mb-5">
          Self-knowledge should increase your agency, not reduce it. TWIN follows these rules:
        </p>
        <div className="mb-8">
          {PRINCIPLES.map(([title, body]) => (
            <div key={title} className="py-3 border-b border-fg/10 last:border-b-0 text-[13.5px] text-fg-dim">
              <b className="text-fg font-semibold">{title}</b> {body}
            </div>
          ))}
        </div>

        <div className="text-fg-faint text-[12.5px] mb-2 tracking-wide">export your data</div>
        <button className="btn-ghost" onClick={exportData}>
          Show my data as JSON
        </button>
        {exported && (
          <textarea
            readOnly
            value={exported}
            className="w-full bg-bg-inset border border-fg/20 text-fg-faint p-3 text-[11.5px] rounded-sm mt-3 min-h-[160px] font-mono"
          />
        )}

        <div className="text-fg-faint text-[12.5px] mt-8 mb-2 tracking-wide">delete everything</div>
        {!confirming ? (
          <button className="btn-ghost" onClick={() => setConfirming(true)}>
            Delete my twin
          </button>
        ) : (
          <div className="bg-bg-elevated border border-warn rounded-sm p-4 mt-1">
            <p className="text-[13.5px] mb-3">
              This permanently deletes your answers, rounds, and streak. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button className="btn-warn" disabled={busy} onClick={deleteEverything}>
                {busy ? "Deleting…" : "Yes, delete everything"}
              </button>
              <button className="btn-ghost" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="text-fg-faint text-[12px] mt-10">
          Data lives in your own PostgreSQL database, authenticated by JWT — nothing is shared between accounts.
        </p>
      </div>
    </div>
  );
}
