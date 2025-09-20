// src/pages/addCourse.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import uploadfile from "../utils/mediaUpload";
import axios from "axios";
import toast from "react-hot-toast";

export default function AddnewCourse() {
  const [courseID, setcourseID] = useState("");
  const [title, settitle] = useState("");
  const [altTitles, setaltTitles] = useState("");
  const [description, setdescription] = useState("");
  const [category, setcategory] = useState("");
  const [tags, settags] = useState("");
  const [level, setlevel] = useState("Beginner");

  // --- One-by-one builders ---
  // Videos (array of { file, name, thumbFile })
  const [videos, setVideos] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoName, setVideoName] = useState("");
  const [videoThumbFile, setVideoThumbFile] = useState(null);

  // PDFs (array of { file, name })
  const [pdfs, setPdfs] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState("");

  // Lessons (array of { name })
  const [lessons, setLessons] = useState([]);
  const [lessonName, setLessonName] = useState("");

  const [createdBy, setcreatedBy] = useState("");

  const navigate = useNavigate();

  const splitCSV = (str) =>
    (str || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  // --- Add handlers ---
  const addVideoItem = () => {
    if (!videoFile) {
      toast.error("Please choose a video file.");
      return;
    }
    const base = videoFile.name.replace(/\.[^/.]+$/, "");
    const name = (videoName || base).trim();
    setVideos((prev) => [...prev, { file: videoFile, name, thumbFile: videoThumbFile || null }]);
    // reset current inputs
    setVideoFile(null);
    setVideoName("");
    setVideoThumbFile(null);
  };

  const removeVideoItem = (idx) => {
    setVideos((prev) => prev.filter((_, i) => i !== idx));
  };

  const addPdfItem = () => {
    if (!pdfFile) {
      toast.error("Please choose a PDF file.");
      return;
    }
    const base = pdfFile.name.replace(/\.[^/.]+$/, "");
    const name = (pdfName || base).trim();
    setPdfs((prev) => [...prev, { file: pdfFile, name }]);
    setPdfFile(null);
    setPdfName("");
  };

  const removePdfItem = (idx) => {
    setPdfs((prev) => prev.filter((_, i) => i !== idx));
  };

  const addLessonItem = () => {
    const n = (lessonName || "").trim();
    if (!n) {
      toast.error("Please type a lesson name.");
      return;
    }
    setLessons((prev) => [...prev, { name: n }]);
    setLessonName("");
  };

  const removeLessonItem = (idx) => {
    setLessons((prev) => prev.filter((_, i) => i !== idx));
  };

  async function addCourse() {
    if (!courseID?.trim() || !title?.trim() || !description?.trim() || !category?.trim()) {
      toast.error("Please fill Course ID, Title, Description, and Category.");
      return;
    }

    try {
      const AltTitlesarr = splitCSV(altTitles);
      const Tagsarr = splitCSV(tags);

      // ---- Upload videos + thumbnails one-by-one ----
      const videoUrls = await Promise.all(
        videos.map((v) => uploadfile(v.file))
      );
      const thumbUrls = await Promise.all(
        videos.map((v) => (v.thumbFile ? uploadfile(v.thumbFile) : Promise.resolve("")))
      );

      const videoPayload = videos.map((v, i) => ({
        name: v.name,
        url: videoUrls[i],
        thumbnail: thumbUrls[i] || "",
      }));

      // ---- Upload PDFs one-by-one ----
      const pdfUrls = await Promise.all(
        pdfs.map((p) => uploadfile(p.file))
      );
      const pdfPayload = pdfs.map((p, i) => ({
        fileName: p.file.name,
        url: pdfUrls[i],
        name: p.name,
      }));

      // ---- Lessons to schema ----
      const textLessonsPayload = lessons.map((l) => ({
        name: l.name,
        content: "",
      }));

      const courseData = {
        courseID: courseID.trim(),
        title: title.trim(),
        altTitles: AltTitlesarr,
        description: description.trim(),
        category: category.trim(),
        tags: Tagsarr,
        level,
        videoTutorials: videoPayload,
        pdfResources: pdfPayload,
        textLessons: textLessonsPayload,
        createdBy: createdBy?.trim() || undefined,
      };

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/courses`, courseData);

      toast.success("Course added successfully.");
      navigate("/appointment");
    } catch (error) {
      console.error("Error adding Course:", error);
      toast.error("Course add failed.");
    }
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Agri gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-lime-100" />

      {/* Subtle dotted texture */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 20px 20px, rgba(16,185,129,0.45) 50%, transparent 51%)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-2 text-white shadow-lg shadow-emerald-200">
            <span className="text-xl">🌿</span>
            <span className="font-semibold tracking-wide">GreenGrow • Course Manager</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-emerald-900">
            Add New Course
          </h1>
          <p className="mt-1 text-emerald-700/80">
            Curate high-quality agricultural learning—videos, PDFs, and text lessons.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-emerald-200/70 bg-white/95 backdrop-blur shadow-2xl shadow-emerald-100">
          {/* Decorative top bar */}
          <div className="h-2 w-full rounded-t-2xl bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-400" />

          <div className="p-6">
            {/* Section: Basics */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2 text-emerald-900">
                <span className="text-lg">🌾</span>
                <h2 className="text-lg font-semibold">Course Basics</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Course ID */}
                <div>
                  <label className="block text-sm font-medium text-emerald-900">Course ID</label>
                  <input
                    type="text"
                    placeholder="e.g., AG-101"
                    onChange={(e) => setcourseID(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-emerald-900 placeholder-emerald-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-emerald-900">Title</label>
                  <input
                    type="text"
                    placeholder="Enter Course Title"
                    onChange={(e) => settitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-emerald-900 placeholder-emerald-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                  />
                </div>

                {/* Alt titles */}
                <div>
                  <label className="block text-sm font-medium text-emerald-900">
                    Alternative Titles (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Organic Rice Basics, Paddy 101"
                    onChange={(e) => setaltTitles(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-emerald-900 placeholder-emerald-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-emerald-900">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="rice, fertilizer, irrigation"
                    onChange={(e) => settags(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-emerald-900 placeholder-emerald-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                  />
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-emerald-900">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setlevel(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-emerald-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-emerald-900">Category</label>
                  <input
                    type="text"
                    placeholder="e.g., Organic Farming"
                    onChange={(e) => setcategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-emerald-900 placeholder-emerald-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
              </div>
            </div>

            {/* Section: Media */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2 text-emerald-900">
                <span className="text-lg">🌱</span>
                <h2 className="text-lg font-semibold">Learning Materials</h2>
              </div>

              {/* --- Videos: add one-by-one --- */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-900">Video File</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-white hover:file:bg-emerald-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900">Video Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Soil Preparation"
                    value={videoName}
                    onChange={(e) => setVideoName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-emerald-900 placeholder-emerald-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900">Thumbnail (image)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setVideoThumbFile(e.target.files?.[0] || null)}
                    className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:text-white hover:file:bg-amber-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <div className="md:col-span-3">
                  <button
                    type="button"
                    onClick={addVideoItem}
                    className="mt-1 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    Add Video
                  </button>
                  {videos.length > 0 && (
                    <ul className="mt-3 text-sm text-emerald-900 space-y-1">
                      {videos.map((v, i) => (
                        <li key={i} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2">
                          <span className="truncate">
                            {i + 1}. {v.name} <span className="text-emerald-700/70">({v.file?.name})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeVideoItem(i)}
                            className="ml-3 rounded-lg bg-emerald-100 px-2 py-1 text-emerald-900 hover:bg-emerald-200"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* --- PDFs: add one-by-one --- */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-900">PDF File</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-lime-600 file:px-4 file:py-2 file:text-white hover:file:bg-lime-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-900">PDF Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Paddy Guide"
                    value={pdfName}
                    onChange={(e) => setPdfName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-emerald-900 placeholder-emerald-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <div className="md:self-end">
                  <button
                    type="button"
                    onClick={addPdfItem}
                    className="mt-1 inline-flex items-center justify-center rounded-xl bg-lime-600 px-4 py-2 text-white shadow-md transition hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-lime-300"
                  >
                    Add PDF
                  </button>
                </div>
                <div className="md:col-span-3">
                  {pdfs.length > 0 && (
                    <ul className="mt-3 text-sm text-emerald-900 space-y-1">
                      {pdfs.map((p, i) => (
                        <li key={i} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2">
                          <span className="truncate">
                            {i + 1}. {p.name} <span className="text-emerald-700/70">({p.file?.name})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removePdfItem(i)}
                            className="ml-3 rounded-lg bg-emerald-100 px-2 py-1 text-emerald-900 hover:bg-emerald-200"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* --- Lessons: add one-by-one --- */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-emerald-900">Lesson Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Introduction"
                    value={lessonName}
                    onChange={(e) => setLessonName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-emerald-900 placeholder-emerald-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <div className="md:self-end">
                  <button
                    type="button"
                    onClick={addLessonItem}
                    className="mt-1 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-white shadow-md transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    Add Lesson
                  </button>
                </div>
                <div className="md:col-span-3">
                  {lessons.length > 0 && (
                    <ul className="mt-3 text-sm text-emerald-900 space-y-1">
                      {lessons.map((l, i) => (
                        <li key={i} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2">
                          <span className="truncate">
                            {i + 1}. {l.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeLessonItem(i)}
                            className="ml-3 rounded-lg bg-emerald-100 px-2 py-1 text-emerald-900 hover:bg-emerald-200"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Text Lessons & Description */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2 text-emerald-900">
                <span className="text-lg">🍃</span>
                <h2 className="text-lg font-semibold">Content</h2>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-emerald-900">Description</label>
                <textarea
                  rows="3"
                  placeholder="Enter course description"
                  onChange={(e) => setdescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-emerald-900 placeholder-emerald-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                ></textarea>
              </div>
            </div>

            {/* Section: Meta */}
            <div className="mb-2">
              <div className="mb-3 flex items-center gap-2 text-emerald-900">
                <span className="text-lg">🌼</span>
                <h2 className="text-lg font-semibold">Meta</h2>
              </div>

              {/* Created By */}
              <div>
                <label className="block text-sm font-medium text-emerald-900">
                  Created By (Admin User ID)
                </label>
                <input
                  type="text"
                  placeholder="Enter admin user id"
                  onChange={(e) => setcreatedBy(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-emerald-900 placeholder-emerald-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="text-xs text-emerald-700/70">
                Tip: Ensure you’ve added videos/PDFs before publishing.
              </div>
              <div className="flex gap-3">
                <Link
                  to="/admin/courses"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-100 px-6 py-2 text-emerald-900 ring-1 ring-inset ring-emerald-200 transition hover:bg-emerald-200"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={addCourse}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-2 font-medium text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  Add Course
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-xs text-emerald-800/70">
          Made for sustainable agriculture learning 🌱
        </p>
      </div>
    </div>
  );
}
