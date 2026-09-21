import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Nav from "../components/Nav.jsx";
import CategoryBars from "../components/CategoryBars.jsx";
import TwinPresence from "../components/TwinPresence.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [data, setData] = useState(null);
  const [nextQuestion, setNextQuestion] = useState(undefined);

  function load() {
    api.dashboard().then((res) => setData(res.data));
    api.nextQuestion().then((res) => setNextQuestion(res.data.question));
  }

  useEffect(() => {
    load();
  }, []);

  if (!data) {
    return (
      <div>
        <Nav />
        <div className="max-w-[640px] mx-auto px-6 py-16 text-fg-dim">Loading your twin…</div>
      </div>
    );
  }

  const n = data.round_count;
  const status = n === 0 ? "Still learning you." : n < 4 ? "Starting to see a pattern." : `Calibrated on ${n} rounds.`;
  const sub =
    n === 0
      ? "Your twin has your onboarding answers, but hasn't predicted anything yet."
      : "Every round sharpens or challenges what it thinks it knows.";

  function startRound() {
    navigate("/round");
  }

  return (
    <div>
      <Nav />
      <div className="max-w-[640px] mx-auto px-6 py-14">
        <div className="text-fg-faint text-[12.5px] mb-2">your twin</div>
        <h2 className="font-serif text-[24px] font-medium mb-1.5">{status}</h2>
        <p className="text-fg-dim text-[15.5px] max-w-[52ch] mb-8">{sub}</p>

        <TwinPresence
          username={profile?.username}
          roundCount={n}
          averageScore={data.average_score}
        />

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-bg-elevated border border-fg/10 rounded-sm p-5">
            <div className="font-serif text-[34px] font-medium tabular-nums">
              {data.average_score === null ? "—" : `${Math.round(data.average_score)}%`}
            </div>
            <div className="text-fg-dim text-[12.5px] mt-1">average match</div>
          </div>
          <div className="bg-bg-elevated border border-fg/10 rounded-sm p-5">
            <div className="font-serif text-[34px] font-medium tabular-nums">{data.streak}</div>
            <div className="text-fg-dim text-[12.5px] mt-1">current streak · best {data.best_streak}</div>
          </div>
        </div>

        <div className="mb-9">
          {nextQuestion === undefined ? null : nextQuestion ? (
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" onClick={startRound}>
                New prediction round
              </button>
              <button className="btn-ghost" onClick={() => navigate("/round", { state: { generate: true } })}>
                Surprise me
              </button>
            </div>
          ) : (
            <div>
              <button className="btn-primary" onClick={() => navigate("/round", { state: { generate: true } })}>
                Have your twin write a new scenario
              </button>
              <p className="text-fg-faint text-[13px] mt-3 max-w-[48ch]">
                You've answered every question in the bank. From here your twin writes its own,
                aimed at whatever it understands about you least.
              </p>
            </div>
          )}
        </div>

        <div className="text-fg-faint text-[12.5px] mb-2 tracking-wide">category coverage</div>
        <CategoryBars byCategory={data.by_category} />

        <div className="text-fg-faint text-[12.5px] mt-9 mb-2 tracking-wide">recent rounds</div>
        {data.recent.length === 0 ? (
          <div className="text-fg-faint text-[13.5px] py-3">Nothing yet. Your first round will show up here.</div>
        ) : (
          <div>
            {data.recent.map((r) => (
              <div key={r.id} className="flex justify-between items-center py-3 border-b border-fg/10 last:border-b-0 text-[14px]">
                <div className="max-w-[64%]">{r.question.text}</div>
                <div
                  className="font-semibold tabular-nums"
                  style={{ color: r.score >= 80 ? "#5FA8A0" : r.score >= 55 ? "#EDEAE3" : "#C1666B" }}
                >
                  {r.score}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
