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
          {/* ===== Top hero: media left + key info right ===== */}
          <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-0">
            {/* Left: Thumbnail / Hero */}
            <div className="w-full lg:w-[49%] flex items-stretch justify-center">
              <div className="relative w-full max-w-3xl">
                <img
                  src={
                    (course.thumbnail || "").trim() ||
                    "https://images.unsplash.com/photo-1604335399105-a0d7f1b8cc4b?q=80&w=1200&auto=format&fit=crop"
                  }
                  alt={course.courseName || "Course thumbnail"}
                  className="w-full h-[320px] md:h-[420px] object-cover rounded-none lg:rounded-r-none"
                  loading="lazy"
                />
                {/* Soft overlay gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                {/* Top-left badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                    {course.category || "Agriculture"}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/90 text-gray-800 border">
                    {course.level || "Beginner"}
                  </span>
                </div>
                {/* Bottom-left date */}
                <div className="absolute bottom-3 left-3 text-xs text-white/90">
                  Created: {fmtDate(course.createdAt)}{" "}
                  {course.publishedAt ? `• Published: ${fmtDate(course.publishedAt)}` : ""}
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="w-full lg:w-[51%] bg-emerald-50/60 pt-6 pb-8 px-5 md:px-8 flex flex-col">
              <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">
                {course.courseName}
              </h1>

              {Array.isArray(course.altTitles) && course.altTitles.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">{course.altTitles.join(" | ")}</p>
              )}

              <p className="text-base md:text-lg text-gray-800 mt-4 leading-relaxed">
                {course.description}
              </p>

              {/* Tags */}
              {Array.isArray(course.tags) && course.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {course.tags.map((t, i) => (
                    <span
                      key={`${t}-${i}`}
                      className="text-xs px-2 py-1 rounded-full border bg-white text-gray-700"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Quick stats */}
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-emerald-200 bg-white py-2">
                  <p className="text-lg font-semibold text-emerald-800">
                    {Array.isArray(course.videoTutorials) ? course.videoTutorials.length : 0}
                  </p>
                  <p className="text-[12px] text-gray-600">Videos</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white py-2">
                  <p className="text-lg font-semibold text-emerald-800">
                    {Array.isArray(course.pdfLessons) ? course.pdfLessons.length : 0}
                  </p>
                  <p className="text-[12px] text-gray-600">PDFs</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white py-2">
                  <p className="text-lg font-semibold text-emerald-800">
                    {Array.isArray(course.textLessons) ? course.textLessons.length : 0}
                  </p>
                  <p className="text-[12px] text-gray-600">Text Lessons</p>
                </div>
              </div>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-700">
                <span className="px-2 py-0.5 rounded-md bg-white border">Language: {(course.language || "en").toUpperCase()}</span>
                {course.subCategory && <span className="px-2 py-0.5 rounded-md bg-white border">Sub: {course.subCategory}</span>}
                {course.isPublished ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white">Published</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-gray-400 text-white">Draft</span>
                )}
                {course.isActive ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border">Active</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 border">Inactive</span>
                )}
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
                      className="rounded-xl border border-emerald-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      <div className="relative h-40">
                        <img
                          src={v.thumbnail || "https://via.placeholder.com/640x360?text=Video"}
                          alt={v.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-3 right-3 inline-flex items-center gap-1 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-full shadow hover:bg-emerald-700"
                        >
                          ▶ Play
                        </a>
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

            {/* Footer meta */}
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
