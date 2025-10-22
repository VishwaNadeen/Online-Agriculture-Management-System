// src/pages/Admin/addCourse.jsx
import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import uploadfile from "../utils/mediaUpload";



const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function AddCourse() {
  const navigate = useNavigate();

  // ===== Basic Course Fields =====
  const [courseID, setCourseID] = useState("");
  const [courseName, setCourseName] = useState("");
  const [altTitles, setAltTitles] = useState(""); // comma-separated
  const [thumbnailFile, setThumbnailFile] = useState(null); // optional course cover
  const [thumbnailUrl, setThumbnailUrl] = useState(""); // optional if already hosted
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Agriculture");
  const [tags, setTags] = useState(""); // comma-separated
  const [level, setLevel] = useState("Beginner");
  const [language, setLanguage] = useState("en");
  const [subCategory, setSubCategory] = useState("");

  // ===== Materials =====
  const [videoItems, setVideoItems] = useState([
    { name: "", videoFile: null, thumbFile: null },
  ]);
  const [pdfItems, setPdfItems] = useState([{ name: "", file: null }]);
  const [textItems, setTextItems] = useState([{ name: "", content: "" }]);

  const [isPublished, setIsPublished] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // ===== Helpers =====
  const addVideoRow = () =>
    setVideoItems((prev) => [...prev, { name: "", videoFile: null, thumbFile: null }]);
  const removeVideoRow = (idx) =>
    setVideoItems((prev) => prev.filter((_, i) => i !== idx));

  const addPdfRow = () => setPdfItems((prev) => [...prev, { name: "", file: null }]);
  const removePdfRow = (idx) => setPdfItems((prev) => prev.filter((_, i) => i !== idx));

  const addTextRow = () => setTextItems((prev) => [...prev, { name: "", content: "" }]);
  const removeTextRow = (idx) => setTextItems((prev) => prev.filter((_, i) => i !== idx));

  // ===== Validation =====
  function validateForm() {
    if (!courseID.trim()) return "Course ID is required";
    if (!courseName.trim()) return "Course Name is required";
    if (!description.trim()) return "Description is required";
    if (!category.trim()) return "Category is required";

    // Validate videos
    for (let i = 0; i < videoItems.length; i++) {
      const v = videoItems[i];
      if ((v.name || v.videoFile || v.thumbFile) && (!v.name || !v.videoFile || !v.thumbFile)) {
        return `Video #${i + 1}: name, video file, and thumbnail are all required if adding a video`;
      }
    }

    // Validate pdfs
    for (let i = 0; i < pdfItems.length; i++) {
      const p = pdfItems[i];
      if ((p.name || p.file) && (!p.name || !p.file)) {
        return `PDF #${i + 1}: name and file are required if adding a PDF`;
      }
    }

    // Validate text lessons
    for (let i = 0; i < textItems.length; i++) {
      const t = textItems[i];
      if ((t.name || t.content) && (!t.name || !t.content)) {
        return `Text lesson #${i + 1}: name and content are required if adding a lesson`;
      }
    }

    return null;
  }

  // ===== Submit =====
  async function handleCreateCourse() {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      toast.loading("Uploading media...", { id: "upload" });

      // Upload course thumbnail if a file selected (thumbnailUrl optional alternative)
      let courseThumbnail = thumbnailUrl?.trim() || "";
      if (thumbnailFile) {
        courseThumbnail = await uploadfile(thumbnailFile);
      }

      // Upload videos (video + thumb)
      const videoTutorials = [];
      for (const v of videoItems) {
        if (!v.name && !v.videoFile && !v.thumbFile) continue; // skip empty row
        const [videoUrl, thumbUrl] = await Promise.all([
          uploadfile(v.videoFile),
          uploadfile(v.thumbFile),
        ]);
        videoTutorials.push({
          name: v.name.trim(),
          url: videoUrl,
          thumbnail: thumbUrl,
        });
      }

      // Upload PDFs
      const pdfLessons = [];
      for (const p of pdfItems) {
        if (!p.name && !p.file) continue;
        const pdfUrl = await uploadfile(p.file);
        pdfLessons.push({
          name: p.name.trim(),
          url: pdfUrl,
        });
      }

      // Text lessons (already in memory)
      const textLessons = textItems
        .filter((t) => t.name.trim() && t.content.trim())
        .map((t) => ({
          name: t.name.trim(),
          content: t.content.trim(),
        }));

      const payload = {
        courseID: courseID.trim(),
        courseName: courseName.trim(),
        altTitles: altTitles
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        thumbnail: courseThumbnail,
        description: description.trim(),
        category: category.trim(),
        tags: tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        level,
        language,
        subCategory: subCategory.trim(),
        isPublished,
        isActive,
        videoTutorials,
        pdfLessons,
        textLessons,
      };

      toast.loading("Creating course...", { id: "upload" });

      const token = localStorage.getItem("token"); // optional
      const res = await axios.post(`${BASE_URL}/courses`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success("Course created successfully!", { id: "upload" });
      navigate("/admin/courses"); // change to your admin list route
    } catch (err) {
      console.error(err);
      toast.error("Failed to create course", { id: "upload" });
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-800 mb-6">
          Add New Course
        </h1>

        {/* Basic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Course ID */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Course ID *</label>
            <input
              type="text"
              placeholder="e.g. IRR101"
              value={courseID}
              onChange={(e) => setCourseID(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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

          {/* Course Thumbnail (optional) */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Course Thumbnail (file)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="border rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-xs text-gray-500 mt-1">
              Or paste an existing image URL below
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
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Video & thumbnail required</span>
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
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">PDF required</span>
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
            onClick={handleCreateCourse}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl shadow-md hover:bg-emerald-700 transition"
          >
            Create Course
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
