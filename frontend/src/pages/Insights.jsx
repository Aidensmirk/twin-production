import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Nav from "../components/Nav.jsx";
import CategoryBars from "../components/CategoryBars.jsx";

export default function Insights() {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(false);

  useEffect(() => {
    api.insights().then((res) => setData(res.data));
    api.summary()
      .then((res) => setSummary(res.data))
      .catch(() => setSummaryError(true));
  }, []);

  return (
    <div>
      <Nav />
      <div className="max-w-[640px] mx-auto px-6 py-14">
        <h2 className="font-serif text-[22px] font-medium mb-1">Insights</h2>
        {!data ? (
          <div className="text-fg-dim">Loading…</div>
        ) : data.round_count === 0 ? (
          <div className="text-fg-faint text-[13.5px] py-3">
            Run at least one prediction round to see patterns here.
          </div>
        ) : (
          <>
            <p className="text-fg-dim text-[15.5px] mb-8">How predictable you've actually been, round by round.</p>

            {summary?.ready ? (
              <section className="insight-summary mb-10">
                <div className="text-fg-faint text-[11px] uppercase tracking-[0.16em] mb-2">what your twin has learned</div>
                <h3 className="font-serif text-[25px] leading-tight mb-3">{summary.headline}</h3>
                <p className="text-fg-dim text-[15px] leading-relaxed mb-6">{summary.summary}</p>
                <div className="grid gap-3">
                  {summary.characteristics.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="insight-summary__trait">
                      <div className="text-[13px] text-twin font-medium mb-1">{item.name}</div>
                      <div className="text-[13.5px] text-fg-dim leading-relaxed">{item.evidence}</div>
                    </div>
                  ))}
                </div>
                <p className="text-fg-faint text-[12.5px] leading-relaxed mt-5">{summary.uncertainty}</p>
              </section>
            ) : summary ? (
              <div className="border border-fg/10 bg-bg-elevated px-4 py-3.5 text-[13px] text-fg-dim mb-9">
                Complete {summary.rounds_needed} more {summary.rounds_needed === 1 ? "round" : "rounds"} to see what your twin thinks it knows about you.
              </div>
            ) : summaryError ? (
              <div className="border border-fg/10 bg-bg-elevated px-4 py-3.5 text-[13px] text-fg-dim mb-9">
                Your twin could not refresh its portrait right now. Try again after your next round.
              </div>
            ) : null}

            <div className="text-fg-faint text-[12.5px] mb-2 tracking-wide">match over time</div>
            <div className="flex items-end gap-1 h-[60px] mb-8">
              {data.timeline.map((t, i) => (
                <div
                  key={i}
                  title={`${t.score}%`}
                  className="flex-1 rounded-t-sm min-h-[2px]"
                  style={{
                    height: `${Math.max(6, Math.round((t.score / 100) * 60))}px`,
                    background: t.score >= 80 ? "#5FA8A0" : t.score >= 55 ? "#EDEAE3" : "#C1666B",
                    opacity: 0.9,
                  }}
                />
              ))}
            </div>

            <div className="text-fg-faint text-[12.5px] mb-2 tracking-wide">confidence calibration</div>
            <p className="text-fg-dim text-[15.5px] mb-8">
              Your twin predicts with {data.average_confidence}% average confidence and lands a{" "}
              {data.average_score}% average match.{" "}
              {data.calibration_gap > 12
                ? "It's overconfident — it claims more certainty than it earns."
                : data.calibration_gap < -12
                ? "It's underconfident — it knows you better than it thinks."
                : "Its confidence is fairly well calibrated to its actual accuracy."}
            </p>

            <div className="text-fg-faint text-[12.5px] mb-2 tracking-wide">by category</div>
            <CategoryBars byCategory={data.by_category} />
          </>
        )}
      </div>
    </div>
  );
}
