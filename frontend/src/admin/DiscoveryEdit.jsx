import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AdminDiscoveryForm from "./AdminDiscoveryForm";
import ConfirmDialog from "./ConfirmDialog";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function DiscoveryEdit() {
  const { idOrSlug } = useParams(); // /admin/discoveries/:idOrSlug/edit
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await axios.get(`${BASE}/api/discoveries/${idOrSlug}`);
        if (!mounted) return;
        setData(res.data?.data || null);
      } catch {
        toast.error("Failed to load discovery.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [idOrSlug]);

  const submit = async (formData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in as admin.");
      return;
    }
    try {
      setSubmitting(true);
      await axios.put(`${BASE}/api/discoveries/${data._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Changes saved!");
      navigate(`/admin/discoveries`);
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to update discovery";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in as admin.");
      return;
    }
    try {
      setSubmitting(true);
      await axios.delete(`${BASE}/api/discoveries/${data._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Discovery deleted.");
      navigate(`/admin/discoveries`);
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to delete";
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setShowDelete(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50/95">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-emerald-900">Edit Discovery</h1>
            <p className="text-sm text-emerald-800/80">Update or delete this discovery/news item.</p>
          </div>
          <button
            onClick={() => navigate("/admin/discoveries")}
            className="rounded-xl px-3 py-2 text-sm ring-1 ring-emerald-200 bg-white hover:bg-emerald-50"
          >
            Back to list
          </button>
        </div>

        {/* Skeleton while loading */}
        {loading ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-1/2 bg-emerald-100 rounded" />
              <div className="h-24 w-full bg-emerald-100 rounded" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-10 bg-emerald-100 rounded" />
                <div className="h-10 bg-emerald-100 rounded" />
                <div className="h-10 bg-emerald-100 rounded" />
              </div>
              <div className="h-10 w-1/2 bg-emerald-100 rounded" />
              <div className="grid grid-cols-[180px_1fr] gap-3">
                <div className="h-40 bg-emerald-100 rounded" />
                <div className="h-10 bg-emerald-100 rounded" />
              </div>
              <div className="flex justify-end">
                <div className="h-9 w-32 bg-emerald-100 rounded" />
              </div>
            </div>
          </div>
        ) : data ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm ring-1 ring-black/5">
            <AdminDiscoveryForm
              mode="edit"
              initial={data}
              submitting={submitting}
              onSubmit={submit}
              onDelete={() => setShowDelete(true)}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">Not found.</div>
        )}
      </div>

      {/* Confirm delete popup */}
      <ConfirmDialog
        open={showDelete}
        title="Delete discovery?"
        message="This will permanently remove the discovery and its Cloudinary thumbnail. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setShowDelete(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
