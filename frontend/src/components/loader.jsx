// src/components/PageLoader.jsx
import React from "react";

export default function PageLoader({
  message = "Loading community posts...",
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
        <div className="text-emerald-700 font-medium text-lg">{message}</div>
      </div>
    </div>
  );
}
