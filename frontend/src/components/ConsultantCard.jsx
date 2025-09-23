// src/components/ConsultantCard.jsx
import React from "react";

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function ConsultantCard({ consultant, onPreview }) {
  const handleClick = () => {
    if (typeof onPreview === "function") onPreview(consultant);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group
                 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
      aria-label={`Open actions for ${consultant?.name || "consultant"}`}
    >
      <div className="p-6">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-4">
          {consultant.category}
        </div>

        <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
          {consultant.name}
        </h4>

        <div className="flex items-center text-gray-600 mb-2">
          <LocationIcon />
          <span className="ml-1 text-sm">{consultant.city}</span>
        </div>

        <p className="text-sm text-gray-600 mb-1 line-clamp-2">
          {consultant.about || "—"}
        </p>

        {/* subtle hint that it's clickable */}
        <p className="mt-3 text-xs text-emerald-700/80">Click to choose: Book or View Profile</p>
      </div>
    </div>
  );
}
