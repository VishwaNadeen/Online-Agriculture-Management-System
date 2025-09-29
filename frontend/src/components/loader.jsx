// src/components/loader.jsx
import React from "react";

export default function Loader() {
  return (
    <div className="w-full h-full flex justify-center items-center bg-gradient-to-b from-emerald-50 to-green-120">
      <div className="relative">
        {/* Glow background */}
        <div className="absolute -inset-4 rounded-full bg-emerald-400/20 blur-2xl animate-pulse"></div>

        {/* Spinner ring */}
        <div className="w-[100px] h-[100px] border-[6px] border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>

        {/* Leaf icon inside */}
        <svg
          className="absolute inset-0 m-auto w-8 h-8 text-emerald-700"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19.5 3.5C14 4.5 8.5 8 6.2 10.7c-2.6 3-3.4 6.2-2 8 1.5 2 5.1 1.9 8.2-.5 2.1-1.7 4.5-4.7 5.2-8.1.2-1 .3-1.9.1-2.8-.1-.4.2-.8.6-.9l1.7-.3c.4-.1.7-.5.7-.9-.1-1.2-1.1-2.1-1.2-2.1-.1 0-.1 0 0 0zM7.8 17.1c.2-.8 1.1-2.3 3.8-3.9 1.1-.6 2.4-1.1 3.8-1.5-.7 1.5-1.7 2.8-2.8 3.8-1.5 1.3-3.3 2.1-4.8 1.6z" />
        </svg>
      </div>
    </div>
  );
}
