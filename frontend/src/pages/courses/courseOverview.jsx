// src/pages/Courses/CourseOverview.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import Loader from "../../components/loader";

export default function CourseOverview() {
  const params = useParams(); // expects route like /courses/:courseID
  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (status === "loading") {
      const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      axios
        .get(`${BASE}/courses/${params.courseID}`)
        .then((res) => {
          setCourse(res.data);
          setStatus("success");
        })
        .catch(() => {
          setStatus("error");
          toast.error("Failed to fetch course details.");
        });
    }
  }, [status, params.courseID]);

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" }) : "-";

  return (
    <div className="w-full h-full">
      {status === "loading" && <Loader />}

      {status === "error" && (
        <div className="max-w-4xl mx-auto mt-10 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
          Error loading course.
        </div>
      )}

      {status === "success" && course && (
        <div className="w-full h-full">
          {/* ===== Top hero: FULL-WIDTH media with overlay content (stats panel removed) ===== */}
          <div className="w-full">
            <div className="relative w-full">
              <img
                src={
                  (course.thumbnail || "").trim() || 
                  "https://images.unsplash.com/photo-1604335399105-a0d7f1b8cc4b?q=80&w=1200&auto=format&fit=crop"
                }
                alt={course.courseName || "Course thumbnail"}
                className="w-full h-[360px] md:h-[480px] lg:h-[520px] object-cover"
                loading="lazy"
              />
              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

              {/* Overlay content */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                    {course.category || "Agriculture"}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/90 text-gray-800 border">
                    {course.level || "Beginner"}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/90 text-gray-800 border">
                    {(course.language || "en").toUpperCase()}
                  </span>
                </div>

                <h1 className="text-white font-extrabold text-2xl md:text-4xl leading-tight drop-shadow-sm">
                  {course.courseName}
                </h1>

                {Array.isArray(course.altTitles) && course.altTitles.length > 0 && (
                  <p className="text-sm text-white/80 mt-1">{course.altTitles.join(" | ")}</p>
                )}

                <p className="text-base md:text-lg text-white/90 mt-3 leading-relaxed line-clamp-4">
                  {course.description}
                </p>

                <div className="mt-4 text-xs text-white/80">
                  Created: {fmtDate(course.createdAt)}{" "}
                  {course.publishedAt ? `• Published: ${fmtDate(course.publishedAt)}` : ""}
                </div>
              </div>
            </div>
          </div>

          {/* ===== Content sections ===== */}
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-10">
            {/* Videos */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-emerald-900 mb-4">Video Tutorials</h2>
              {Array.isArray(course.videoTutorials) && course.videoTutorials.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {course.videoTutorials.map((v, i) => (
                    <div
                      key={`vid-${i}`}
                      className="group rounded-xl border border-emerald-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      <div className="relative h-44 md:h-48">
                        <img
                          src={v.thumbnail || "https://via.placeholder.com/640x360?text=Video"}
                          alt={v.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Centered play overlay */}
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600/90 text-white shadow-lg group-hover:scale-105 transition transform">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-5.197-3.028A1 1 0 008 9.028v5.944a1 1 0 001.555.832l5.197-3.028a1 1 0 000-1.664z" />
                            </svg>
                          </span>
                        </a>
                        {/* Subtle bottom gradient for readability on hover */}
                        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-emerald-900 line-clamp-2">{v.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No videos added yet.</p>
              )}
            </section>

            {/* PDFs */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-emerald-900 mb-4">PDF Lessons</h2>
              {Array.isArray(course.pdfLessons) && course.pdfLessons.length > 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-white overflow-hidden">
                  <ul className="divide-y">
                    {course.pdfLessons.map((p, i) => (
                      <li key={`pdf-${i}`} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0 pr-3">
                          <p className="font-medium text-emerald-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500 truncate">{p.url}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <a
                            className="px-3 py-1.5 rounded-lg border text-sm hover:bg-emerald-50"
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                          <a
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                            href={p.url}
                            download
                          >
                            Download
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-600">No PDFs added yet.</p>
              )}
            </section>

            {/* Text lessons */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-emerald-900 mb-4">Text Lessons</h2>
              {Array.isArray(course.textLessons) && course.textLessons.length > 0 ? (
                <div className="space-y-3">
                  {course.textLessons.map((t, i) => (
                    <details
                      key={`txt-${i}`}
                      className="group rounded-xl border border-emerald-200 bg-white p-4 open:shadow-md"
                    >
                      <summary className="cursor-pointer list-none flex items-center justify-between">
                        <span className="font-semibold text-emerald-900">{t.name}</span>
                        <svg
                          className="h-5 w-5 text-emerald-700 transition-transform group-open:rotate-180"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-3 text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {t.content}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No text lessons added yet.</p>
              )}
            </section>

            {/* Footer meta (concise) */}
            <section className="pt-2 text-sm text-gray-600">
              <div className="flex flex-wrap gap-3">
                <span>Created at: {fmtDate(course.createdAt)}</span>
                {course.updatedAt && <span>Last updated: {fmtDate(course.updatedAt)}</span>}
                {course.publishedAt && <span>Published at: {fmtDate(course.publishedAt)}</span>}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
