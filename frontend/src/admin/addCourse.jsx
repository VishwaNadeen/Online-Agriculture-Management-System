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

  // ===== Validation States =====
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

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

  // ===== Validation Functions =====
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'courseID':
        if (!value.trim()) {
          newErrors.courseID = 'Course ID is required';
        } else if (value.length < 3) {
          newErrors.courseID = 'Course ID must be at least 3 characters';
        } else if (value.length > 20) {
          newErrors.courseID = 'Course ID must be less than 20 characters';
        } else if (!/^[a-zA-Z0-9]+$/.test(value)) {
          newErrors.courseID = 'Course ID can only contain letters and numbers';
        } else {
          delete newErrors.courseID;
        }
        break;
        
      case 'courseName':
        if (!value.trim()) {
          newErrors.courseName = 'Course name is required';
        } else if (value.trim().length < 3) {
          newErrors.courseName = 'Course name must be at least 3 characters';
        } else if (value.trim().length > 100) {
          newErrors.courseName = 'Course name must be less than 100 characters';
        } else {
          delete newErrors.courseName;
        }
        break;
        
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required';
        } else if (value.trim().length < 10) {
          newErrors.description = 'Description must be at least 10 characters';
        } else if (value.trim().length > 1000) {
          newErrors.description = 'Description must be less than 1000 characters';
        } else {
          delete newErrors.description;
        }
        break;
        
      case 'category':
        if (!value.trim()) {
          newErrors.category = 'Category is required';
        } else if (value.trim().length < 2) {
          newErrors.category = 'Category must be at least 2 characters';
        } else if (value.trim().length > 50) {
          newErrors.category = 'Category must be less than 50 characters';
        } else {
          delete newErrors.category;
        }
        break;
        
      case 'subCategory':
        if (value && value.trim().length > 50) {
          newErrors.subCategory = 'Sub-category must be less than 50 characters';
        } else {
          delete newErrors.subCategory;
        }
        break;
        
      case 'altTitles':
        if (value && value.trim().length > 200) {
          newErrors.altTitles = 'Alternative titles must be less than 200 characters';
        } else {
          delete newErrors.altTitles;
        }
        break;
        
      case 'tags':
        if (value && value.trim().length > 200) {
          newErrors.tags = 'Tags must be less than 200 characters';
        } else {
          delete newErrors.tags;
        }
        break;
        
      case 'thumbnailUrl':
        if (value && value.trim()) {
          const urlPattern = /^https?:\/\/.+/;
          if (!urlPattern.test(value.trim())) {
            newErrors.thumbnailUrl = 'Please enter a valid URL starting with http:// or https://';
          } else {
            delete newErrors.thumbnailUrl;
          }
        } else {
          delete newErrors.thumbnailUrl;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (name, value) => {
    // Handle Course ID with special filtering
    if (name === 'courseID') {
      const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
      setCourseID(filteredValue);
      if (touched[name]) {
        validateField(name, filteredValue);
      }
    } else {
      // Handle other fields normally
      switch (name) {
        case 'courseName':
          setCourseName(value);
          break;
        case 'description':
          setDescription(value);
          break;
        case 'category':
          setCategory(value);
          break;
        case 'subCategory':
          setSubCategory(value);
          break;
        case 'altTitles':
          setAltTitles(value);
          break;
        case 'tags':
          setTags(value);
          break;
        case 'thumbnailUrl':
          setThumbnailUrl(value);
          break;
        default:
          break;
      }
      
      if (touched[name]) {
        validateField(name, value);
      }
    }
  };

  const handleFieldBlur = (name, value) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  // Check form validity
  React.useEffect(() => {
    const requiredFields = ['courseID', 'courseName', 'description', 'category'];
    const hasRequiredFields = requiredFields.every(field => {
      const value = field === 'courseID' ? courseID : 
                   field === 'courseName' ? courseName :
                   field === 'description' ? description :
                   field === 'category' ? category : '';
      return value && value.trim();
    });
    const hasNoErrors = Object.keys(errors).length === 0;
    
    setIsFormValid(hasRequiredFields && hasNoErrors);
  }, [courseID, courseName, description, category, errors]);

  // ===== Validation =====
  function validateForm() {
    // Mark all fields as touched to show all errors
    const allFields = ['courseID', 'courseName', 'description', 'category', 'subCategory', 'altTitles', 'tags', 'thumbnailUrl'];
    const newTouched = {};
    allFields.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    // Validate all fields
    const newErrors = {};
    allFields.forEach(field => {
      const value = field === 'courseID' ? courseID : 
                   field === 'courseName' ? courseName :
                   field === 'description' ? description :
                   field === 'category' ? category :
                   field === 'subCategory' ? subCategory :
                   field === 'altTitles' ? altTitles :
                   field === 'tags' ? tags :
                   field === 'thumbnailUrl' ? thumbnailUrl : '';
      
      const isValid = validateField(field, value);
      if (!isValid) {
        newErrors[field] = errors[field];
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors before submitting");
      return false;
    }

    return true;

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

        {/* Form Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h3 className="text-sm font-semibold text-red-800">Please fix the following errors:</h3>
            </div>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field} className="capitalize">{field.replace(/([A-Z])/g, ' $1').toLowerCase()}: {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Basic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Course ID */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Course ID *</label>
            <input
              type="text"
              placeholder="e.g. IRR101"
              value={courseID}
              onChange={(e) => handleFieldChange('courseID', e.target.value)}
              onBlur={(e) => handleFieldBlur('courseID', e.target.value)}
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                touched.courseID && errors.courseID 
                  ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                  : touched.courseID && !errors.courseID && courseID
                  ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                  : 'focus:ring-emerald-500'
              }`}
            />
            {touched.courseID && errors.courseID && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.courseID}
              </p>
            )}
            {touched.courseID && !errors.courseID && courseID && (
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <span className="mr-1">✓</span>
                Course ID looks good
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Only letters and numbers allowed (no special characters, spaces, or symbols)
            </p>
          </div>

          {/* Course Name */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold">Course Name *</label>
            <input
              type="text"
              placeholder="e.g. Drip Irrigation Basics"
              value={courseName}
              onChange={(e) => handleFieldChange('courseName', e.target.value)}
              onBlur={(e) => handleFieldBlur('courseName', e.target.value)}
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                touched.courseName && errors.courseName 
                  ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                  : touched.courseName && !errors.courseName && courseName
                  ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                  : 'focus:ring-emerald-500'
              }`}
            />
            {touched.courseName && errors.courseName && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.courseName}
              </p>
            )}
            {touched.courseName && !errors.courseName && courseName && (
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <span className="mr-1">✓</span>
                Course name looks good
              </p>
            )}
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
            onChange={(e) => handleFieldChange('description', e.target.value)}
            onBlur={(e) => handleFieldBlur('description', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              touched.description && errors.description 
                ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                : touched.description && !errors.description && description
                ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                : 'focus:ring-emerald-500'
            }`}
          />
          {touched.description && errors.description && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <span className="mr-1">⚠</span>
              {errors.description}
            </p>
          )}
          {touched.description && !errors.description && description && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <span className="mr-1">✓</span>
              Description looks good
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/1000 characters
          </p>
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
            disabled={!isFormValid}
            className={`px-6 py-2 rounded-xl shadow-md transition ${
              isFormValid 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            {isFormValid ? 'Create Course' : 'Fill Required Fields'}
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
