import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import TwinSignal from "../components/TwinSignal.jsx";

export default function Onboarding() {
  const { profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.onboardingQuestions()
      .then((res) => {
        if (!res.data.length) {
          setError("No onboarding questions are available yet. Please try again shortly.");
          setQuestions([]);
          return;
        }
        setQuestions(res.data);
      })
      .catch(() => {
        setError("Couldn't load the onboarding questions. Please refresh and try again.");
        setQuestions([]);
      });
  }, []);

  if (!questions) {
    return <div className="max-w-[640px] mx-auto px-6 py-16 text-fg-dim">Loading…</div>;
  }

  if (!questions.length) {
    return (
      <div className="max-w-[640px] mx-auto px-6 py-16">
        <div className="bg-warn/10 border border-warn text-[#E4A7AA] px-3.5 py-3 rounded-sm text-[13px]">
          {error}
        </div>
      </div>
    );
  }

  const idx = profile?.onboarding_index || 0;
  const q = questions[idx];

  if (!q) {
    navigate("/home");
    return null;
  }

  async function submit(e) {
    e.preventDefault();
    const val = answer.trim();
    if (!val) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.answerOnboarding(q.id, val);
      setProfile((p) => ({ ...p, onboarding_index: res.data.onboarding_index, onboarded: res.data.onboarded }));
      setAnswer("");
      if (res.data.onboarded) {
        navigate("/home");
      }
    } catch (err) {
      setError("Couldn't save that answer. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-[640px] mx-auto px-6 py-16">
      <div className="flex gap-1.5 mb-9">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < idx ? "bg-twin" : i === idx ? "bg-you" : "bg-fg/15"
            }`}
          />
        ))}
      </div>
      <div className="text-fg-faint text-[12px] mb-3">
        {q.category} · {idx + 1} of {questions.length}
      </div>
      <h2 className="font-serif text-[26px] leading-snug mb-7 font-medium">{q.text}</h2>
      <TwinSignal value={answer} />
      {error && <div className="bg-warn/10 border border-warn text-[#E4A7AA] px-3.5 py-3 rounded-sm text-[13px] mb-4">{error}</div>}
      <form onSubmit={submit}>
        <textarea
          className="field min-h-[110px]"
          placeholder="Answer honestly — let the first honest answer surface."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          autoFocus
        />
        <div className="mt-5">
          <button className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
}
