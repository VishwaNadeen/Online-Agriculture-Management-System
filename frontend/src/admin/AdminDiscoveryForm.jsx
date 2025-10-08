/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";

const initialState = {
  title: "",
  description: "",
  category: "",
  tags: [],
  readMoreUrl: "",
  isPublished: true,
  thumbnailFile: null,
  previewUrl: "",
};

export default function AdminDiscoveryForm({
  mode = "create",             // "create" | "edit"
  initial = null,              // discovery doc for edit mode
  submitting = false,
  onSubmit,                    // (formData) => void
  onDelete,                    // optional () => void (only in edit)
}) {
  const [state, setState] = useState(initialState);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initial && mode === "edit") {
      setState((s) => ({
        ...s,
        title: initial.title || "",
        description: initial.description || "",
        category: initial.category || "",
        tags: Array.isArray(initial.tags) ? initial.tags : [],
        readMoreUrl: initial.readMoreUrl || "",
        isPublished: initial.isPublished !== false,
        thumbnailFile: null,
        previewUrl: initial.thumbnail?.url || "",
      }));
    }
  }, [initial, mode]);

  const tagInputRef = useRef(null);
  const suggestions = useMemo(
    () => ["Technology", "Crops", "Soil", "Climate", "Organic", "Pests", "News"],
    []
  );

  const addTag = (tag) => {
    const t = tag.trim();
    if (!t) return;
    setState((s) =>
      s.tags.includes(t) ? s : { ...s, tags: [...s.tags, t] }
    );
  };

  const removeTag = (tag) =>
    setState((s) => ({ ...s, tags: s.tags.filter((x) => x !== tag) }));

  const handleTagKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(e.currentTarget.value);
      e.currentTarget.value = "";
    }
  };

  const handleFile = (file) => {
    if (!file) {
      setState((s) => ({ ...s, thumbnailFile: null, previewUrl: "" }));
      return;
    }
    const url = URL.createObjectURL(file);
    setState((s) => ({ ...s, thumbnailFile: file, previewUrl: url }));
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("title", state.title);
    fd.append("description", state.description);
    if (state.category) fd.append("category", state.category);
    if (state.tags.length) fd.append("tags", state.tags.join(","));
    if (state.readMoreUrl) fd.append("readMoreUrl", state.readMoreUrl);
    fd.append("isPublished", String(!!state.isPublished));
    if (state.thumbnailFile) fd.append("thumbnail", state.thumbnailFile); // field name must be "thumbnail"
    return fd;
  };

  const submitHandler = (e) => {
    e.preventDefault();
    onSubmit?.(buildFormData());
  };

  return (
    <form onSubmit={submitHandler} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-emerald-900">Title *</label>
        <input
          required
          minLength={3}
          value={state.title}
          onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-sm focus:border-emerald-400 focus:outline-none"
          placeholder="e.g., Solar-Powered Drip Irrigation"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-emerald-900">Description *</label>
        <textarea
          required
          minLength={10}
          rows={6}
          value={state.description}
          onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-sm focus:border-emerald-400 focus:outline-none"
          placeholder="Describe the discovery or news item…"
        />
      </div>

      {/* Category & Published */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-emerald-900">Category</label>
          <input
            list="discovery-categories"
            value={state.category}
            onChange={(e) => setState((s) => ({ ...s, category: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-sm focus:border-emerald-400 focus:outline-none"
            placeholder="Technology, Crops, Soil, Climate…"
          />
          <datalist id="discovery-categories">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-emerald-900">
            <input
              type="checkbox"
              checked={!!state.isPublished}
              onChange={(e) => setState((s) => ({ ...s, isPublished: e.target.checked }))}
              className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            />
            Published
          </label>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-emerald-900">Tags</label>
        <div className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {state.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-800 ring-1 ring-emerald-200"
              >
                #{t}
                <button type="button" onClick={() => removeTag(t)} className="text-emerald-700 hover:text-emerald-900">
                  ×
                </button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              onKeyDown={handleTagKey}
              placeholder="Type a tag and press Enter"
              className="min-w-[150px] flex-1 bg-transparent text-sm outline-none placeholder:text-emerald-900/40"
            />
          </div>
        </div>
      </div>

      {/* Read more URL */}
      <div>
        <label className="block text-sm font-medium text-emerald-900">Read More URL</label>
        <input
          type="url"
          value={state.readMoreUrl}
          onChange={(e) => setState((s) => ({ ...s, readMoreUrl: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-sm focus:border-emerald-400 focus:outline-none"
          placeholder="https://example.com/article"
        />
      </div>

      {/* Thumbnail */}
      <div>
        <label className="block text-sm font-medium text-emerald-900">Thumbnail</label>
        <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
          <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
            {state.previewUrl ? (
              <img src={state.previewUrl} alt="Preview" className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 items-center justify-center text-emerald-400">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" d="M3 5h18M3 19h18M3 5v14m18-14v14M7 15l3-3 3 3 4-4 3 3" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-white hover:file:bg-emerald-700"
            />
            {state.previewUrl && (
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  setState((s) => ({ ...s, thumbnailFile: null, previewUrl: "" }));
                }}
                className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-emerald-200 hover:bg-emerald-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700"
          >
            Delete
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? (mode === "create" ? "Creating…" : "Saving…") : (mode === "create" ? "Create" : "Save changes")}
          </button>
        </div>
      </div>
    </form>
  );
}
