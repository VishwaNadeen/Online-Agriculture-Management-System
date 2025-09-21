// src/components/courses/CourseCard.jsx
import { Link } from "react-router-dom";

export default function CourseCard({ course }) {
  const img =
    (course?.thumbnail || "").trim() ||
    "https://images.unsplash.com/photo-1604335399105-a0d7f1b8cc4b?q=80&w=1200&auto=format&fit=crop";

  const videoCount = Array.isArray(course?.videoTutorials) ? course.videoTutorials.length : 0;
  const pdfCount = Array.isArray(course?.pdfLessons) ? course.pdfLessons.length : 0;
  const textCount = Array.isArray(course?.textLessons) ? course.textLessons.length : 0;

  const ratingVal = Number(course?.rating ?? course?.avgRating ?? 4.5);
  const rating = Math.max(0, Math.min(5, isNaN(ratingVal) ? 4.5 : ratingVal));
  const reviews = course?.reviewsCount ?? course?.reviews?.length ?? 0;

  const title = course?.courseName || "Untitled course";
  const category = course?.category || "Agriculture";
  const level = course?.level || "Beginner";
  const language = (course?.language || "en").toUpperCase();

  const desc =
    (course?.description ||
      "Practical, field-tested agriculture lessons with videos, PDFs and text guides.")
      .replace(/\s+/g, " ")
      .trim();

  // Rating stars
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const fill =
      rating >= i + 1
        ? "text-yellow-400"
        : rating >= i + 0.5
        ? "text-yellow-300"
        : "text-gray-300";
    return (
      <svg
        key={i}
        className={`h-4 w-4 ${fill}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.985 2.126c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.38 8.719c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  });

  return (
    <div className="w-full max-w-sm md:max-w-md lg:max-w-lg flex flex-col bg-white shadow-lg rounded-2xl overflow-hidden border border-emerald-100 hover:shadow-emerald-200 transition">
      {/* Thumbnail with blur + overlay */}
      <div className="relative w-full h-[200px]">
        <img
          src={img}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        <div className="relative z-10 h-full w-full p-3 flex flex-col justify-between">
          <div className="flex justify-between">
            <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200">
              {category}
            </span>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-snug line-clamp-2">
              {title}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex">{stars}</div>
              <span className="text-white/90 text-sm font-semibold">{rating.toFixed(1)}</span>
              <span className="text-white/70 text-xs">({reviews})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col p-4 gap-3 flex-1">
        {/* Quick facts */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 py-1.5">
            <p className="text-sm font-semibold text-emerald-800">{videoCount}</p>
            <p className="text-[11px] text-emerald-700/80">Videos</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 py-1.5">
            <p className="text-sm font-semibold text-emerald-800">{pdfCount}</p>
            <p className="text-[11px] text-emerald-700/80">PDFs</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 py-1.5">
            <p className="text-sm font-semibold text-emerald-800">{textCount}</p>
            <p className="text-[11px] text-emerald-700/80">Lessons</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{desc}</p>

        {/* Level / Language */}
        <div className="flex justify-between items-center text-[12px] text-gray-600">
          <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">
            {level}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">
            {language}
          </span>
        </div>

        {/* Learn more */}
        <div className="mt-auto flex justify-end">
          <Link
            to={`/courses/${course?.courseID}`}
            className="inline-flex items-center text-emerald-800 text-sm font-semibold bg-white border border-emerald-200 rounded-full px-3 py-1 shadow-sm hover:bg-emerald-50 hover:border-emerald-300 transition"
          >
            Learn more
            <svg
              className="ml-1 h-4 w-4 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
