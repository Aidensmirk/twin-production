import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Nav from "../components/Nav.jsx";

export default function Reveal() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const round = state?.round;

  if (!round) {
    navigate("/home");
    return null;
  }

  async function nextRound() {
    const res = await api.nextQuestion();
    // If the bank is empty, go into the round anyway with generate:true --
    // the twin will author a fresh scenario rather than dead-ending.
    navigate("/round", { state: res.data.question ? {} : { generate: true } });
  }

  return (
    <div>
      <Nav minimal />
      <div className="max-w-[820px] mx-auto px-6 py-14">
        <div className="flex flex-col items-center mb-9">
          <div className="font-serif text-[64px] font-medium bg-gradient-to-r from-you to-twin bg-clip-text text-transparent animate-score-in">
            {round.score}%
          </div>
          <div className="text-fg-dim text-[13.5px] mt-1">{round.match_level}</div>
        </div>

        <div className="text-fg-faint text-[12px] text-center mb-1.5">{round.question.category}</div>
        <h2 className="font-serif text-[19px] text-center mb-8 font-medium">{round.question.text}</h2>

        <div className="grid md:grid-cols-2 gap-px bg-fg/10 border border-fg/10 rounded-sm overflow-hidden mb-6">
          <div className="bg-bg-elevated p-6 animate-panel-in">
            <div className="text-[11px] font-semibold tracking-wide text-you mb-2.5">PRESENT YOU</div>
            <div className="text-[14.5px] leading-relaxed">{round.answer_text}</div>
          </div>
          <div className="bg-bg-elevated p-6 animate-panel-in" style={{ animationDelay: "0.1s" }}>
            <div className="text-[11px] font-semibold tracking-wide text-twin mb-2.5">AI TWIN PREDICTED</div>
            <div className="text-[14.5px] leading-relaxed">{round.prediction_text}</div>
            <div className="text-[12px] text-fg-faint mt-3">confidence: {round.confidence}%</div>
          </div>
        </div>

        {round.change_detected && round.change_note && (
          <div className="border-l-2 border-you pl-3.5 py-1 text-[13.5px] text-fg-dim mb-5">
            {round.change_note}
          </div>
        )}

        <div className="bg-bg-inset border border-fg/10 p-4.5 rounded-sm text-[14px] text-fg-dim leading-relaxed mb-6">
          {round.explanation}
          {round.patterns?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3.5">
              {round.patterns.map((p, i) => (
                <span key={i} className="text-[12px] text-fg-dim bg-bg-elevated border border-fg/10 px-2.5 py-1 rounded-full">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button className="btn-primary" onClick={nextRound}>
            Next round
          </button>
          <button className="btn-ghost" onClick={() => navigate("/home")}>
            Back home
          </button>
        </div>
      </div>
    </div>
  );
}
