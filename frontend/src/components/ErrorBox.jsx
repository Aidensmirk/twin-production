import React from "react";

export default function ErrorBox({ message, onRetry }) {
  return (
    <div className="mb-4">
      <div className="bg-warn/10 border border-warn text-[#E4A7AA] px-3.5 py-3 rounded-sm text-[13px] mb-3">
        {message}
      </div>
      {onRetry && (
        <button className="btn-ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
