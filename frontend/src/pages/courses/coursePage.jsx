// src/pages/Courses/CoursesPage.jsx
import axios from "axios";
import { useEffect, useMemo, useState, useRef } from "react";
import Loader from "../../components/loader";
import CourseCard from "../../components/courses/courseCard";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters + search
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All");
  const [showSuggest, setShowSuggest] = useState(false);

  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      axios
        .get(`${BASE}/courses`)
        .then((res) => {
          setCourses(Array.isArray(res.data) ? res.data : []);
          setLoading(false);
        })
        .catch((err) => {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load courses"
          );
          setLoading(false);
        });
    }
  }, [isLoading]);

  // close suggestions on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target)) {
        setShowSuggest(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // categories + levels
  const categories = useMemo(() => {
    const set = new Set((courses || []).map((c) => c?.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [courses]);

  const levels = useMemo(() => {
    const set = new Set((courses || []).map((c) => c?.level).filter(Boolean));
    const ordered = ["Beginner", "Intermediate", "Advanced"].filter((x) =>
      set.has(x)
    );
    const others = Array.from(set).filter((x) => !ordered.includes(x));
    return ["All", ...ordered, ...others];
  }, [courses]);

  // suggestions (for search bar)
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const pool = (courses || []).filter(Boolean);
    const ranked = pool
      .map((c) => ({
        course: c,
        score:
          (c.courseName?.toLowerCase().includes(q) ? 2 : 0) +
          (c.description?.toLowerCase().includes(q) ? 1 : 0) +
          (Array.isArray(c.tags) &&
          c.tags.some((t) => String(t).toLowerCase().includes(q))
            ? 1
            : 0),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    return ranked.map((r) => r.course);
  }, [query, courses]);

  // filter visible courses
  const visibleCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (courses || []).filter((c) => {
      const okCat = category === "All" || c?.category === category;
      const okLvl = level === "All" || c?.level === level;
      if (!q) return okCat && okLvl;

      const inName = c?.courseName?.toLowerCase?.().includes(q);
      const inDesc = c?.description?.toLowerCase?.().includes(q);
      const inTags = Array.isArray(c?.tags)
        ? c.tags.some((t) => String(t).toLowerCase().includes(q))
        : false;

      return okCat && okLvl && (inName || inDesc || inTags);
    });
  }, [courses, category, level, query]);

  const applySuggestion = (c) => {
    setQuery(c?.courseName || "");
    setShowSuggest(false);
    // Optional: scroll to grid after selecting a suggestion
  };

  // Clickable search icon action
  const handleSearchIconClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (query.trim().length >= 2) {
      setShowSuggest(true);
    }
  };

  return (
    <div className="w-full h-full">
      {isLoading ? (
        <Loader />
      ) : error ? (
        <div className="max-w-4xl mx-auto mt-10 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      ) : courses.length === 0 ? (
        <div className="max-w-4xl mx-auto mt-10 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-center">
          No courses found.
        </div>
      ) : (
        <>
          {/* --- Top filters row (Search + Category + Level) --- */}
          <div
            className="w-full max-w-6xl mx-auto px-4 pt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
            ref={searchWrapRef}
          >
            {/* Search */}
            <div className="relative w-full sm:flex-1">
              <label className="block text-sm font-semibold text-emerald-900 mb-1">
                Search
              </label>

              {/* Clickable icon */}
              <button
                type="button"
                onClick={handleSearchIconClick}
                aria-label=" Search"
                className="absolute left-3 top-[38px] sm:top-[38px] h-5 w-5 text-emerald-700 hover:text-emerald-900"
                tabIndex={-1}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.1-4.4a7.75 7.75 0 11-15.5 0 7.75 7.75 0 0115.5 0z" />
                </svg>
              </button>

              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggest(true);
                }}
                onFocus={() =>
                  query.trim().length >= 2 && setShowSuggest(true)
                }
                placeholder="Search courses..."
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 pl-10"
              />

              {showSuggest && suggestions.length > 0 && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-emerald-200 bg-white shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <button
                      key={s.courseID || s._id}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="w-full text-left px-4 py-2 hover:bg-emerald-50"
                    >
                      <div className="font-medium text-emerald-900 line-clamp-1">
                        {s.courseName}
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-1">
                        {s.category} • {s.level || "Beginner"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <div className="w-full sm:w-48">
              <label className="block text-sm font-semibold text-emerald-900 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div className="w-full sm:w-48">
              <label className="block text-sm font-semibold text-emerald-900 mb-1">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid of courses */}
          {visibleCourses.length === 0 ? (
            <div className="max-w-4xl mx-auto mt-10 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-center">
              No courses match your filters.
            </div>
          ) : (
            <div className="w-full flex flex-wrap gap-[40px] justify-center items-center py-[40px]">
              {visibleCourses.map((course) => (
                <CourseCard
                  key={course.courseID || course._id}
                  course={course}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
