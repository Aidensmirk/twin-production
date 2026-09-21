import React from "react";

const SIGNALS = [
  "Signal is quiet",
  "A pattern is forming",
  "Your twin is listening",
  "That answer has a point of view",
];

export default function TwinSignal({ value = "", stage = "answering" }) {
  const length = value.trim().length;
  const level = Math.min(100, Math.max(12, length * 2));
  const signalIndex = length === 0 ? 0 : Math.min(3, Math.floor(length / 45) + 1);
  const label = stage === "answering" ? SIGNALS[signalIndex] : stage === "scoring" ? "Comparing signals" : "Tuning in";

  return (
    <div className="twin-signal" aria-live="polite">
      <div className="signal-orbit" aria-hidden="true">
        <span className="signal-orbit__ring signal-orbit__ring--outer" />
        <span className="signal-orbit__ring signal-orbit__ring--inner" />
        <span className="signal-orbit__dot signal-orbit__dot--one" />
        <span className="signal-orbit__dot signal-orbit__dot--two" />
        <span className="signal-orbit__core" />
      </div>
      <div className="signal-copy">
        <div className="text-[12px] text-fg-dim">{label}</div>
        <div className="signal-meter" aria-hidden="true">
          <span style={{ width: `${level}%` }} />
        </div>
      </div>
    </div>
  );
}
