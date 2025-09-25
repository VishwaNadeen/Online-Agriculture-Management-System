// src/components/StarRating.jsx
import React, { useState } from "react";

/** 1–5 stars with hover preview; no Clear button */
export default function StarRating({
  value = 0,
  onChange = () => {},
  size = "text-2xl",
  readonly = false,
  idPrefix = "star",
}) {
  const [hover, setHover] = useState(0);
  const stars = [1, 2, 3, 4, 5];

  const handleKey = (e, n) => {
    if (readonly) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(n); }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onChange(Math.max(1, value - 1)); }
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onChange(Math.min(5, value + 1)); }
  };

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {stars.map((n) => {
        const filled = (hover || value) >= n;
        return (
          <button
            key={n}
            id={`${idPrefix}-${n}`}
            type="button"
            role="radio"
            aria-checked={filled}
            disabled={readonly}
            onClick={() => !readonly && onChange(n)}
            onKeyDown={(e) => handleKey(e, n)}
            onMouseEnter={() => !readonly && setHover(n)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`${size} leading-none select-none transition
              ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}
              ${filled ? "text-amber-500" : "text-gray-300"}`}
            title={`${n} star${n > 1 ? "s" : ""}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
