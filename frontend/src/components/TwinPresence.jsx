import React from "react";

function getTwinVoice(roundCount, averageScore) {
  if (!roundCount) return "I am listening for the decisions you make when nobody is watching.";
  if (averageScore >= 80) return "I can feel the shape of your instincts now.";
  if (averageScore >= 55) return "I recognize some of you. The rest is still becoming clear.";
  return "You keep surprising me. That is where the useful signal lives.";
}

export default function TwinPresence({ roundCount = 0, averageScore = null, username = "you" }) {
  const state = roundCount === 0 ? "observing" : roundCount < 4 ? "forming" : "calibrated";
  const voice = getTwinVoice(roundCount, averageScore);

  return (
    <section className="twin-presence" aria-label="Your twin's current state">
      <div className="twin-presence__portrait" aria-hidden="true">
        <div className="twin-presence__halo" />
        <div className="twin-face">
          <span className="twin-face__ear twin-face__ear--left" />
          <span className="twin-face__ear twin-face__ear--right" />
          <div className="twin-face__head">
            <span className="twin-face__hair" />
            <span className="twin-face__brow twin-face__brow--left" />
            <span className="twin-face__brow twin-face__brow--right" />
            <span className="twin-face__eye twin-face__eye--left" />
            <span className="twin-face__eye twin-face__eye--right" />
            <span className="twin-face__nose" />
            <span className="twin-face__mouth" />
          </div>
          <div className="twin-face__neck" />
          <div className="twin-face__shoulders" />
        </div>
      </div>
      <div className="twin-presence__copy">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="text-fg-faint text-[11px] uppercase tracking-[0.16em]">{username}'s twin</div>
          <div className="twin-presence__state"><span />{state}</div>
        </div>
        <p className="font-serif text-[20px] leading-snug text-fg mb-2">{voice}</p>
        <div className="flex items-center gap-2 text-[12px] text-fg-faint">
          <span className="twin-presence__signal" />
          built from {roundCount} {roundCount === 1 ? "round" : "rounds"} of signal
        </div>
      </div>
    </section>
  );
}