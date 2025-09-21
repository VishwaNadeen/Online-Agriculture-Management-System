// src/pages/Admin/UpdateCourse.jsx
import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import uploadfile from "../utils/mediaUpload";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function UpdateCourse() {
  const location = useLocation();
  const navigate = useNavigate();

  // Expecting location.state to carry the course object
  const c = location.state || {};

  // ===== Basic Course Fields (prefilled) =====
  const [courseID, setCourseID] = useState(c.courseID || "");
  const [courseName, setCourseName] = useState(c.courseName || "");
  const [altTitles, setAltTitles] = useState(Array.isArray(c.altTitles) ? c.altTitles.join(",") : (c.altTitles || ""));
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(c.thumbnail || "");
  const [description, setDescription] = useState(c.description || "");
  const [category, setCategory] = useState(c.category || "Agriculture");
  const [tags, setTags] = useState(Array.isArray(c.tags) ? c.tags.join(",") : (c.tags || ""));
  const [level, setLevel] = useState(c.level || "Beginner");
  const [language, setLanguage] = useState(c.language || "en");
  const [subCategory, setSubCategory] = useState(c.subCategory || "");

  // ===== Materials (prefilled) =====
  // Allow keeping existing URLs or replacing with new files
  const [videoItems, setVideoItems] = useState(
    (Array.isArray(c.videoTutorials) && c.videoTutorials.length
      ? c.videoTutorials
      : [{ name: "", url: "", thumbnail: "" }]
    ).map(v => ({ ...v, videoFile: null, thumbFile: null }))
  );

  const [pdfItems, setPdfItems] = useState(
    (Array.isArray(c.pdfLessons) && c.pdfLessons.length
      ? c.pdfLessons
      : [{ name: "", url: "" }]
    ).map(p => ({ ...p, file: null }))
  );

  const [textItems, setTextItems] = useState(
    (Array.isArray(c.textLessons) && c.textLessons.length
      ? c.textLessons
      : [{ name: "", content: "" }])
  );

  const [isPublished, setIsPublished] = useState(
    typeof c.isPublished === "boolean" ? c.isPublished : true
  );
  const [isActive, setIsActive] = useState(
    typeof c.isActive === "boolean" ? c.isActive : true
  );

  // ===== Helpers =====
  const addVideoRow = () =>
    setVideoItems(prev => [...prev, { name: "", url: "", thumbnail: "", videoFile: null, thumbFile: null }]);
  const removeVideoRow = (idx) =>
    setVideoItems(prev => prev.filter((_, i) => i !== idx));

  const addPdfRow = () =>
    setPdfItems(prev => [...prev, { name: "", url: "", file: null }]);
  const removePdfRow = (idx) =>
    setPdfItems(prev => prev.filter((_, i) => i !== idx));

  const addTextRow = () =>
    setTextItems(prev => [...prev, { name: "", content: "" }]);
  const removeTextRow = (idx) =>
    setTextItems(prev => prev.filter((_, i) => i !== idx));

  // ===== Validation (simple, like your add form) =====
  function validateForm() {
    if (!courseID.trim()) return "Course ID is required";
    if (!courseName.trim()) return "Course Name is required";
    if (!description.trim()) return "Description is required";
    if (!category.trim()) return "Category is required";

    // If a video row is touched, require a name (file/urls optional for update)
    for (let i = 0; i < videoItems.length; i++) {
      const v = videoItems[i];
      const touched = v.name || v.url || v.thumbnail || v.videoFile || v.thumbFile;
      if (touched && !v.name) return `Video #${i + 1}: name is required`;
    }
    // PDFs: if touched, need name
    for (let i = 0; i < pdfItems.length; i++) {
      const p = pdfItems[i];
      const touched = p.name || p.url || p.file;
      if (touched && !p.name) return `PDF #${i + 1}: name is required`;
    }
    // Text: both fields if touched
    for (let i = 0; i < textItems.length; i++) {
      const t = textItems[i];
      const touched = t.name || t.content;
      if (touched && (!t.name || !t.content)) {
        return `Text lesson #${i + 1}: name and content are required`;
      }
    }
    return null;
  }

  // ===== Submit (UPDATE) =====
  async function handleUpdateCourse() {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      toast.loading("Preparing updates...", { id: "upd" });

      // Thumbnail: keep existing URL unless a new file is chosen or user typed a new URL
      let finalThumbnail = (thumbnailUrl || "").trim();
      if (thumbnailFile) {
        finalThumbnail = await uploadfile(thumbnailFile);
      }

      // Videos: if new files chosen, upload; otherwise keep existing urls
      const videoTutorials = [];
      for (const v of videoItems) {
        const isBlank =
          !v.name && !v.url && !v.thumbnail && !v.videoFile && !v.thumbFile;
        if (isBlank) continue;

        let url = v.url || "";
        let thumb = v.thumbnail || "";

        if (v.videoFile) url = await uploadfile(v.videoFile);
        if (v.thumbFile) thumb = await uploadfile(v.thumbFile);

        if (v.name && url) {
          videoTutorials.push({
            name: v.name.trim(),
            url,
            thumbnail: thumb || "",
          });
        }
      }

      // PDFs: keep url unless replaced with a new file
      const pdfLessons = [];
      for (const p of pdfItems) {
        const isBlank = !p.name && !p.url && !p.file;
        if (isBlank) continue;

        let url = p.url || "";
        if (p.file) url = await uploadfile(p.file);

        if (p.name && url) {
          pdfLessons.push({ name: p.name.trim(), url });
        }
      }

      // Text Lessons
      const textLessons = textItems
        .filter(t => t.name && t.content)
        .map(t => ({ name: t.name.trim(), content: t.content.trim() }));

      const payload = {
        courseID: courseID.trim(), // backend keeps this consistent
        courseName: courseName.trim(),
        altTitles: altTitles.split(",").map(s => s.trim()).filter(Boolean),
        thumbnail: finalThumbnail,
        description: description.trim(),
        category: category.trim(),
        tags: tags.split(",").map(s => s.trim()).filter(Boolean),
        level,
        language,
        subCategory: subCategory.trim(),
        isPublished,
        isActive,
        videoTutorials,
        pdfLessons,
        textLessons,
      };

      toast.loading("Updating course...", { id: "upd" });

      // No auth headers as requested
      await axios.patch(`${BASE_URL}/courses/${courseID}`, payload);

      toast.success("Course updated successfully!", { id: "upd" });
      navigate("/courseAdmin");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to update course", { id: "upd" });
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-800 mb-6">
          Update Course
        </h1>

        {/* Basic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Course ID (locked) */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Course ID *</label>
            <input
              type="text"
              value={courseID}
              disabled
              onChange={(e) => setCourseID(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
            />
            <span className="text-xs text-gray-500 mt-1">
              ID is fixed (comes from selected course).
            </span>
          </div>

          {/* Course Name */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Course Name *</label>
            <input
              type="text"
              placeholder="e.g. Drip Irrigation Basics"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Alt Titles */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Alternative Titles</label>
            <input
              type="text"
              placeholder="Comma-separated (e.g. Drip 101, Getting Started)"
              value={altTitles}
              onChange={(e) => setAltTitles(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Category *</label>
            <input
              type="text"
              placeholder="e.g. Irrigation"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* SubCategory */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Sub-Category</label>
            <input
              type="text"
              placeholder="e.g. Drip Irrigation"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Language */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="en">English</option>
              <option value="si">Sinhala</option>
              <option value="ta">Tamil</option>
            </select>
          </div>

          {/* Level */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          {/* Tags */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Tags</label>
            <input
              type="text"
              placeholder="Comma-separated (e.g. water, pipes, emitters)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Course Thumbnail */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Course Thumbnail (file)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="border rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-xs text-gray-500 mt-1">
              Or keep/change the image URL below
            </span>
            <input
              type="url"
              placeholder="https://public.url/cover.jpg"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="mt-2 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="text-sm font-semibold">Description *</label>
          <textarea
            rows={4}
            placeholder="Enter course description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Published</label>
            <select
              value={String(isPublished)}
              onChange={(e) => setIsPublished(e.target.value === "true")}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold">Active</label>
            <select
              value={String(isActive)}
              onChange={(e) => setIsActive(e.target.value === "true")}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        {/* ===== Videos ===== */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-emerald-800">Video Tutorials</h2>
            <button
              onClick={addVideoRow}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              + Add Video
            </button>
          </div>

          {videoItems.map((v, idx) => (
            <div
              key={`video-${idx}`}
              className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 border rounded-xl p-3"
            >
              <input
                type="text"
                placeholder={`Video #${idx + 1} name`}
                value={v.name}
                onChange={(e) => {
                  const copy = [...videoItems];
                  copy[idx].name = e.target.value;
                  setVideoItems(copy);
                }}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex flex-col">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const copy = [...videoItems];
                    copy[idx].videoFile = e.target.files?.[0] || null;
                    setVideoItems(copy);
                  }}
                  className="border rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {v.url ? (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-700 mt-1 underline"
                  >
                    Current video
                  </a>
                ) : (
                  <span className="text-xs text-gray-500 mt-1">No current video</span>
                )}
              </div>
              <div className="flex flex-col">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const copy = [...videoItems];
                    copy[idx].thumbFile = e.target.files?.[0] || null;
                    setVideoItems(copy);
                  }}
                  className="border rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {v.thumbnail ? (
                  <a
                    href={v.thumbnail}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-700 mt-1 underline"
                  >
                    Current thumbnail
                  </a>
                ) : (
                  <span className="text-xs text-gray-500 mt-1">No current thumbnail</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Leave files empty to keep current URLs
                </span>
                {videoItems.length > 1 && (
                  <button
                    onClick={() => removeVideoRow(idx)}
                    className="px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ===== PDFs ===== */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-emerald-800">PDF Lessons</h2>
            <button
              onClick={addPdfRow}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              + Add PDF
            </button>
          </div>

          {pdfItems.map((p, idx) => (
            <div
              key={`pdf-${idx}`}
              className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 border rounded-xl p-3"
            >
              <input
                type="text"
                placeholder={`PDF #${idx + 1} name`}
                value={p.name}
                onChange={(e) => {
                  const copy = [...pdfItems];
                  copy[idx].name = e.target.value;
                  setPdfItems(copy);
                }}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex flex-col">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const copy = [...pdfItems];
                    copy[idx].file = e.target.files?.[0] || null;
                    setPdfItems(copy);
                  }}
                  className="border rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-700 mt-1 underline"
                  >
                    Current PDF
                  </a>
                ) : (
                  <span className="text-xs text-gray-500 mt-1">No current PDF</span>
                )}
              </div>
              <div className="flex items-center justify-end">
                {pdfItems.length > 1 && (
                  <button
                    onClick={() => removePdfRow(idx)}
                    className="px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ===== Text Lessons ===== */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-emerald-800">Text Lessons</h2>
            <button
              onClick={addTextRow}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              + Add Text Lesson
            </button>
          </div>

          {textItems.map((t, idx) => (
            <div
              key={`text-${idx}`}
              className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 border rounded-xl p-3"
            >
              <input
                type="text"
                placeholder={`Lesson #${idx + 1} name`}
                value={t.name}
                onChange={(e) => {
                  const copy = [...textItems];
                  copy[idx].name = e.target.value;
                  setTextItems(copy);
                }}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <textarea
                rows={3}
                placeholder="Enter lesson content"
                value={t.content}
                onChange={(e) => {
                  const copy = [...textItems];
                  copy[idx].content = e.target.value;
                  setTextItems(copy);
                }}
                className="md:col-span-2 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center justify-end md:col-span-3">
                {textItems.length > 1 && (
                  <button
                    onClick={() => removeTextRow(idx)}
                    className="px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ===== Actions ===== */}
        <div className="w-full flex justify-center gap-4 mt-8">
          <button
            onClick={handleUpdateCourse}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl shadow-md hover:bg-emerald-700 transition"
          >
            Update Course
          </button>
          <Link
            to="/admin/courses"
            className="bg-gray-400 text-white px-6 py-2 rounded-xl shadow-md hover:bg-gray-500 transition"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
