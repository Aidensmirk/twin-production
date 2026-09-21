import React from "react";

export default function Spinner({ label }) {
  return (
    <div className="flex items-center gap-2.5 text-fg-dim text-[13px] bg-bg-elevated border border-fg/10 px-3.5 py-3 rounded-sm">
      <div className="spin w-3.5 h-3.5 flex-shrink-0" />
      <div>{label}</div>
    </div>
  );
}
