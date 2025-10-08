import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminDiscoveryForm from "./AdminDiscoveryForm";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function DiscoveryCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (formData) => {
    const token = localStorage.getItem("token"); // adjust if your project stores it differently
    if (!token) {
      toast.error("You must be logged in as admin.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${BASE}/api/discoveries`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Discovery created!");
      const slugOrId = res.data?.data?.slug || res.data?.data?._id;
      navigate(`/discoveries/${slugOrId}`); // Navigate to the discovery details page
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to create discovery";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50/95">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold text-emerald-900 mb-2">Add Discovery</h1>
        <p className="text-sm text-emerald-800/80 mb-6">
          Create a new discovery/news item. Only admins can create and publish.
        </p>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm ring-1 ring-black/5">
          <AdminDiscoveryForm mode="create" submitting={submitting} onSubmit={submit} />
        </div>
      </div>
    </div>
  );
}
