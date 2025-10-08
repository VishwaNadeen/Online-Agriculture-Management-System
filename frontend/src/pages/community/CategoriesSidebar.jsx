// CategoriesSidebar.jsx
import React from "react";

export default function CategoriesSidebar({ category, setCategory }) {
  // Removed “Livestock”
  const categories = [
    "All",
    "Crop Issues",
    "Pest & Disease",
    "Irrigation & Soil",
    "Organic Farming",
    "Machinery & Tools",
    "General",
  ];

  return (
    // Removed sticky so sidebar scrolls normally with page
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-lg p-6 h-fit">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <svg
            className="w-5 h-5 text-emerald-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-emerald-800">Categories</h2>
      </div>

      <ul className="space-y-1">
        {categories.map((cat) => (
          <li key={cat}>
            <button
              onClick={() => setCategory(cat)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group ${
                category === cat
                  ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold shadow-md transform scale-[1.02]"
                  : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:translate-x-1"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{cat}</span>
                {category === cat && (
                  <svg
                    className="w-4 h-4 text-emerald-200"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
