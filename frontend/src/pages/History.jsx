import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Nav from "../components/Nav.jsx";

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function History() {
  const [rounds, setRounds] = useState(null);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    api.history().then((res) => setRounds(res.data));
  }, []);

  return (
    <div>
      <Nav />
      <div className="max-w-[640px] mx-auto px-6 py-14">
        <h2 className="font-serif text-[22px] font-medium mb-6">History</h2>
        {!rounds ? (
          <div className="text-fg-dim">Loading…</div>
        ) : rounds.length === 0 ? (
          <div className="text-fg-faint text-[13.5px] py-3">Your completed rounds will appear here.</div>
        ) : (
          rounds.map((r) => {
            const open = openId === r.id;
            return (
              <div
                key={r.id}
                className="border-b border-fg/10 py-4 cursor-pointer"
                onClick={() => setOpenId(open ? null : r.id)}
              >
                <div className="flex justify-between items-baseline gap-3">
                  <div className="text-[14.5px]">{r.question.text}</div>
                  <div
                    className="font-semibold tabular-nums"
                    style={{ color: r.score >= 80 ? "#5FA8A0" : r.score >= 55 ? "#EDEAE3" : "#C1666B" }}
                  >
                    {r.score}%
                  </div>
                </div>
                <div className="text-fg-faint text-[11.5px] mt-1">
                  {r.question.category} · {fmtDate(r.created_at)} · {r.match_level}
                </div>
                {open && (
                  <div className="mt-3.5 text-[13.5px] text-fg-dim leading-relaxed space-y-2.5">
                    <div>
                      <div className="text-fg-faint text-[11px] mb-0.5">your answer</div>
                      {r.answer_text}
                    </div>
                    <div>
                      <div className="text-fg-faint text-[11px] mb-0.5">twin predicted ({r.confidence}% confidence)</div>
                      {r.prediction_text}
                    </div>
                    <div>
                      <div className="text-fg-faint text-[11px] mb-0.5">why</div>
                      {r.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
