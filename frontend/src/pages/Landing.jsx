import React from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="max-w-[640px] mx-auto px-6 min-h-screen flex flex-col justify-center py-16">
      <div className="text-[14px] text-fg-faint mb-7 tracking-wide">
        <b className="text-fg font-semibold">TWIN</b> — predictive self-experiment
      </div>
      <h1 className="font-serif text-[42px] leading-[1.12] mb-5 max-w-[11ch] font-medium">
        Meet the version of you built from your decisions.
      </h1>
      <p className="text-fg-dim text-[16.5px] max-w-[46ch] mb-9">
        You answer questions. TWIN learns the pattern. Before your next answer, it
        predicts what you'll say — then shows you exactly how close it got.
      </p>
      <div className="flex items-center gap-0 mb-10 text-[13px] text-fg-faint">
        <span className="px-3.5 py-1.5 rounded-full border border-you-dim text-you">
          Present You
        </span>
        <span className="px-2.5">vs</span>
        <span className="px-3.5 py-1.5 rounded-full border border-twin-dim text-twin">
          AI Twin
        </span>
      </div>
      <div className="flex gap-3">
        <button className="btn-primary" onClick={() => navigate("/register")}>
          Begin
        </button>
        <button className="btn-ghost" onClick={() => navigate("/login")}>
          I already have a twin
        </button>
      </div>
      <p className="text-fg-faint text-[12px] mt-10">
        Takes about 4 minutes to seed your first profile.
      </p>
    </div>
  );
}
