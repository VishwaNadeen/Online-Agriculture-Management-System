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
  const [videoTutorials, setvideoTutorials] = useState([]); // FileList
  const [pdfResources, setpdfResources] = useState([]); // FileList
  const [textLessons, settextLessons] = useState("");
  const [createdBy, setcreatedBy] = useState("");

  const navigate = useNavigate();

  const splitCSV = (str) =>
    (str || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

  async function addCourse() {
    if (!courseID?.trim() || !title?.trim() || !description?.trim() || !category?.trim()) {
      toast.error("Please fill Course ID, Title, Description, and Category.");
      return;
    }
    if (!createdBy?.trim() || !isValidObjectId(createdBy.trim())) {
      toast.error("Created By must be a valid 24-char Mongo ObjectId.");
      return;
    }

    try {
      const AltTitlesarr = splitCSV(altTitles);
      const Tagsarr = splitCSV(tags);
      const TextLessonsarr = splitCSV(textLessons); // -> string[]

      // ---- Upload videos (FileList -> URLs as string[]) ----
      const videoFiles = Array.from(videoTutorials || []);
      const videoUrls = videoFiles.length
        ? await Promise.all(videoFiles.map((f) => uploadfile(f)))
        : []; // -> string[]

      // ---- Upload PDFs (FileList -> URLs) ----
      const pdfFiles = Array.from(pdfResources || []);
      const pdfUrls = pdfFiles.length
        ? await Promise.all(pdfFiles.map((f) => uploadfile(f)))
        : [];

      // Map exactly to your schema: { fileName, url }
      const pdfPayload = pdfFiles.map((f, i) => ({
        fileName: f.name,
        url: pdfUrls[i],
      }));

      const courseData = {
        courseID: courseID.trim(),
        title: title.trim(),
        altTitles: AltTitlesarr,
        description: description.trim(),
        category: category.trim(),
        tags: Tagsarr,
        level,
        videoTutorials: videoUrls,     // <-- string[]
        textLessons: TextLessonsarr,   // <-- string[]
        pdfResources: pdfPayload,      // <-- { fileName, url }[]
        createdBy: createdBy.trim(),   // <-- ObjectId as string
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

              {/* Video */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-emerald-900">
                  Video Tutorials
                </label>
                <input
                  multiple
                  type="file"
                  accept="video/*"
                  onChange={(e) => setvideoTutorials(e.target.files)}
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-white hover:file:bg-emerald-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                />
                <p className="mt-1 text-xs text-emerald-700/70">Upload MP4, MKV, or MOV files.</p>
              </div>

              {/* PDFs */}
              <div>
                <label className="block text-sm font-medium text-emerald-900">PDF Resources</label>
                <input
                  multiple
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setpdfResources(e.target.files)}
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-lime-600 file:px-4 file:py-2 file:text-white hover:file:bg-lime-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                />
                <p className="mt-1 text-xs text-emerald-700/70">You can select multiple PDFs.</p>
              </div>
            </div>

            {/* Section: Text Lessons & Description */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2 text-emerald-900">
                <span className="text-lg">🍃</span>
                <h2 className="text-lg font-semibold">Content</h2>
              </div>

              {/* Text Lessons */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-emerald-900">
                  Text Lessons (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Lesson 1, Lesson 2"
                  onChange={(e) => settextLessons(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-emerald-900 placeholder-emerald-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                />
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
