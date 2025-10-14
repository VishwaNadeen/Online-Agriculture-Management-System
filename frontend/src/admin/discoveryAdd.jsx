import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminDiscoveryForm from "./AdminDiscoveryForm";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function DiscoveryAdd() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (formData) => {
    const token = localStorage.getItem("token"); // change if you store JWT differently
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
        {/* Heading Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-emerald-900">Add Discovery</h1>
            <p className="text-sm text-emerald-800/80">Create a new discovery/news item.</p>
          </div>
          {/* Button to navigate back to the discoveries list */}
          <button
            onClick={() => navigate("/admin/discoveries")}
            className="rounded-xl px-3 py-2 text-sm ring-1 ring-emerald-200 bg-white hover:bg-emerald-50"
          >
            Back to list
          </button>
        </div>

        {/* Discovery Form */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm ring-1 ring-black/5">
          <AdminDiscoveryForm mode="create" submitting={submitting} onSubmit={submit} />
        </div>
      </div>
    </div>
  );
}
