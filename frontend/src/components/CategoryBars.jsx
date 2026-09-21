import React from "react";

export default function CategoryBars({ byCategory }) {
  const cats = ["values", "money", "relationships", "risk", "creativity", "goals", "habits"];
  return (
    <div className="space-y-2.5">
      {cats.map((c) => {
        const entry = byCategory?.[c] || { count: 0, avg: null };
        const width = entry.count ? entry.avg : 3;
        return (
          <div key={c} className="grid grid-cols-[110px_1fr_50px] items-center gap-3 text-[12.5px]">
            <div className="text-fg-dim capitalize">{c}</div>
            <div className="h-1.5 bg-bg-inset rounded-full overflow-hidden">
              <div
                className="h-full bg-twin rounded-full transition-all duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
            <div className="text-fg-faint text-right tabular-nums">
              {entry.count ? `${Math.round(entry.avg)}%` : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
