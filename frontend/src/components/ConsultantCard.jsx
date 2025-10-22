// src/components/ConsultantCard.jsx
import React from "react";

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg className="w-4 h-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CheckBadgeIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
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

  // Generate rating (mock: based on yearsExp or random)
  const rating = consultant.rating || (consultant.yearsExp ? Math.min(5, 3.5 + consultant.yearsExp * 0.1) : 4.2);
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Generate initials for avatar
  const initials = (consultant.name || "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Profile picture or fallback to initials
  const profilePicture = consultant.profilePicture || consultant.avatar || consultant.image;

  // Specializations (limit to 2 for card)
  const specs = consultant.specializations || consultant.specialization
    ? [consultant.specialization]
    : [];
  const displaySpecs = Array.isArray(specs) ? specs.slice(0, 2) : specs ? [specs].slice(0, 2) : [];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="relative h-full bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100 hover:border-emerald-300 transform hover:-translate-y-1"
      aria-label={`Open actions for ${consultant?.name || "consultant"}`}
    >
      {/* Gradient top accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600" />

      <div className="p-5">
        {/* Header: Avatar + Name + Badge */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={consultant.name}
                className="w-16 h-16 rounded-full object-cover shadow-lg ring-4 ring-emerald-50 group-hover:ring-emerald-100 transition-all"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-lg font-bold shadow-lg ring-4 ring-emerald-50 group-hover:ring-emerald-100 transition-all">
                {initials || "??"}
              </div>
            )}
            {consultant.yearsExp >= 5 && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                <CheckBadgeIcon className="text-emerald-500" />
              </div>
            )}
          </div>

          {/* Name + Category */}
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
              {consultant.name}
            </h4>
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {consultant.category}
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center text-yellow-500">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} filled={i < fullStars || (i === fullStars && hasHalfStar)} />
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
          <span className="text-xs text-gray-500">({Math.floor(Math.random() * 50) + 10} reviews)</span>
        </div>

        {/* Location + Experience */}
        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <LocationIcon />
            <span className="line-clamp-1">{consultant.city}</span>
          </div>
          {consultant.yearsExp != null && (
            <div className="flex items-center gap-1">
              <BriefcaseIcon />
              <span>{consultant.yearsExp}+ yrs</span>
            </div>
          )}
        </div>

        {/* Specializations */}
        {displaySpecs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {displaySpecs.map((spec, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs rounded-md bg-blue-50 text-blue-700 border border-blue-200"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        {/* About */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[2.5rem]">
          {consultant.about || consultant.bio || "Experienced agricultural consultant ready to help your farm thrive."}
        </p>

        {/* Footer CTA */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-emerald-600 font-medium group-hover:text-emerald-700 transition-colors">
              View Details →
            </span>
            <span className="text-xs text-gray-500 italic">Click to book</span>
          </div>
        </div>
      </div>

      {/* Hover overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
