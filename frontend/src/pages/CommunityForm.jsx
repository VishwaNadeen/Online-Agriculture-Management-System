// src/pages/community/CommunityForm.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function CommunityForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    comment: "",
    image: "",
    rating: 3,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.comment.trim()) e.comment = "Comment is required";
    if (form.rating < 1 || form.rating > 5) e.rating = "Rating must be 1–5";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${BASE}/community`, {
        title: form.title.trim(),
        comment: form.comment.trim(),
        image: form.image.trim(),
        rating: Number(form.rating),
      });
      // Go to details page so user can add replies
      navigate(`/community/${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-emerald-800 mb-6">Create Community Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className={`w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 ${errors.title ? "border-red-400" : "border-gray-300"}`}
            placeholder="e.g., Tomato leaves have black spots"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium mb-2">Comment / Description <span className="text-red-500">*</span></label>
          <textarea
            rows={5}
            value={form.comment}
            onChange={(e) => handleChange("comment", e.target.value)}
            className={`w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 ${errors.comment ? "border-red-400" : "border-gray-300"}`}
            placeholder="Describe the issue, when it started, weather conditions, etc."
          />
          {errors.comment && <p className="mt-1 text-sm text-red-600">{errors.comment}</p>}
        </div>

        {/* Image URL + Preview */}
        <div>
          <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
          <input
            type="url"
            value={form.image}
            onChange={(e) => handleChange("image", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="https://..."
          />
          {form.image ? (
            <div className="mt-3">
              <img
                src={form.image}
                alt="preview"
                className="h-40 w-auto rounded-lg border border-gray-200 object-cover"
                onError={() => handleChange("image", "")}
              />
              <p className="mt-1 text-xs text-gray-500">If the image fails to load, link might be invalid.</p>
            </div>
          ) : null}
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-2">Rating (1–5)</label>
          <select
            value={form.rating}
            onChange={(e) => handleChange("rating", e.target.value)}
            className={`w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 ${errors.rating ? "border-red-400" : "border-gray-300"}`}
          >
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={submitting}
            type="submit"
            className="rounded-xl bg-emerald-600 px-5 py-3 text-white font-medium shadow hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Post"}
          </button>
          <span className="text-sm text-gray-500">You can add replies after creating the post.</span>
        </div>
      </form>
    </div>
  );
}
