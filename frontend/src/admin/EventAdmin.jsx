import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BiEdit, BiPlus, BiTrash } from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ui/ConfirmModal";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// Simple in-memory cache to avoid StrictMode double-mount flicker
let eventsCache = null; // Array | null
let eventsCacheTime = 0; // number
const CACHE_TTL_MS = 30_000; // 30s

export default function EventAdmin() {
  const hasFreshCache = eventsCache && Date.now() - eventsCacheTime < CACHE_TTL_MS;
  const [events, setEvents] = useState(() => (eventsCache ? eventsCache : []));
  const [isLoading, setIsLoading] = useState(() => (!eventsCache ? true : false));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const navigate = useNavigate();

  // Initial load: use cache immediately to avoid loader flash; do a silent refresh in background.
  useEffect(() => {
    let cancelled = false;
    const fetchData = async (showLoader) => {
      if (showLoader) setIsLoading(true);
      setIsRefreshing(true);
      try {
        const res = await axios.get(`${BASE_URL}/events`);
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        eventsCache = list;
        eventsCacheTime = Date.now();
        setEvents((prev) => {
          if (!prev || prev.length !== list.length) return list;
          const prevIds = prev.map((e) => e._id).join(",");
          const nextIds = list.map((e) => e._id).join(",");
          return prevIds !== nextIds ? list : prev;
        });
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load events", err);
          toast.error("Failed to load events");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    // If cache is fresh, render instantly and refresh silently (no loader)
    if (hasFreshCache) {
      // ensure state uses cached (already set in initializer), then refresh silently
      fetchData(false);
    } else if (!eventsCache) {
      // no cache at all: fetch with loader once
      fetchData(true);
    } else {
      // stale cache present: show cached content, refresh silently
      fetchData(false);
    }

    return () => {
      cancelled = true;
    };
  }, [hasFreshCache]);

  const onRequestDelete = useCallback((id) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    // Optimistic update: remove from UI immediately to avoid loader flicker
    setEvents((prev) => prev.filter((e) => e._id !== id));
    // keep cache in sync
    if (eventsCache) {
      eventsCache = eventsCache.filter((e) => e._id !== id);
      eventsCacheTime = Date.now();
    }
    setConfirmOpen(false);
    setPendingDeleteId(null);
    axios
      .delete(`${BASE_URL}/events/${id}`)
      .then(() => {
        toast.success("Event deleted");
      })
      .catch((err) => {
        console.error("Delete failed", err);
        toast.error("Failed to delete event");
        // revert if needed (re-fetch minimal)
        axios
          .get(`${BASE_URL}/events`)
          .then((res) => {
            const list = Array.isArray(res.data) ? res.data : [];
            eventsCache = list;
            eventsCacheTime = Date.now();
            setEvents(list);
          })
          .catch(() => {});
      });
  }, [pendingDeleteId]);

  const rows = useMemo(() => events || [], [events]);

  return (
    <div className="w-full min-h-screen bg-emerald-50 relative">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">
            Events (Admin)
          </h1>
          {/* Keep header stable to avoid perceived blinking */}
          {isRefreshing && (
            <span className="text-sm text-emerald-700">Updating</span>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-[1100px] w-full">
              <thead className="bg-emerald-100/70 border-b border-emerald-200">
                <tr className="text-left text-emerald-900">
                  <th className="p-3 text-sm font-semibold">Title</th>
                  <th className="p-3 text-sm font-semibold">Category</th>
                  <th className="p-3 text-sm font-semibold">Trainer</th>
                  <th className="p-3 text-sm font-semibold">Date</th>
                  <th className="p-3 text-sm font-semibold">Time</th>
                  <th className="p-3 text-sm font-semibold">Location</th>
                  <th className="p-3 text-sm font-semibold">Capacity</th>
                  <th className="p-3 text-sm font-semibold">Deadline</th>
                  <th className="p-3 text-sm font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((ev, idx) => {
                    const {
                      _id,
                      title,
                      category,
                      trainerName,
                      date,
                      time,
                      location,
                      capacity,
                      registrationDeadline,
                    } = ev || {};

                    const dateStr = date ? new Date(date).toLocaleDateString() : "-";
                    const deadlineStr = registrationDeadline
                      ? new Date(registrationDeadline).toLocaleDateString()
                      : "-";

                    return (
                      <tr
                        key={_id || idx}
                        className="border-b border-emerald-100 hover:bg-emerald-50/50 transition"
                      >
                        <td className="p-3 text-sm text-emerald-900">{title}</td>
                        <td className="p-3 text-sm text-emerald-700">{category}</td>
                        <td className="p-3 text-sm text-emerald-700">{trainerName}</td>
                        <td className="p-3 text-sm text-emerald-700">{dateStr}</td>
                        <td className="p-3 text-sm text-emerald-700">{time}</td>
                        <td className="p-3 text-sm text-emerald-700">{location}</td>
                        <td className="p-3 text-sm text-emerald-700 text-center">{capacity}</td>
                        <td className="p-3 text-sm text-emerald-700">{deadlineStr}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <BiTrash
                              title="Delete"
                              className="bg-red-500 p-[7px] text-3xl rounded-full text-amber-50 cursor-pointer hover:bg-red-600"
                              onClick={() => onRequestDelete(_id)}
                            />
                            <BiEdit
                              title="Edit"
                              className="bg-emerald-700 p-[7px] text-3xl rounded-full text-amber-50 cursor-pointer hover:bg-emerald-800"
                              onClick={() => navigate(`/events/${_id}/edit`)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {/* Skeleton rows to avoid empty flash during first load */}
                {rows.length === 0 && (
                  Array.from({ length: isLoading ? 5 : 0 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="border-b border-emerald-100">
                      <td className="p-3"><div className="h-4 w-40 bg-emerald-100 rounded"/></td>
                      <td className="p-3"><div className="h-4 w-24 bg-emerald-100 rounded"/></td>
                      <td className="p-3"><div className="h-4 w-32 bg-emerald-100 rounded"/></td>
                      <td className="p-3"><div className="h-4 w-24 bg-emerald-100 rounded"/></td>
                      <td className="p-3"><div className="h-4 w-16 bg-emerald-100 rounded"/></td>
                      <td className="p-3"><div className="h-4 w-28 bg-emerald-100 rounded"/></td>
                      <td className="p-3"><div className="h-4 w-12 bg-emerald-100 rounded mx-auto"/></td>
                      <td className="p-3"><div className="h-4 w-24 bg-emerald-100 rounded"/></td>
                      <td className="p-3"><div className="h-8 w-24 bg-emerald-100 rounded"/></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {rows.length === 0 && !isLoading && (
              <div className="p-8 text-center text-emerald-800">No events found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <Link
        to={"addEvent"}
        className="fixed bottom-5 right-5 px-4 py-3 bg-amber-300 text-black rounded-full shadow-2xl border border-amber-400 hover:bg-amber-200 transition flex items-center gap-2"
      >
        <BiPlus className="text-2xl" />
        <span className="font-medium hidden sm:block">Add Event</span>
      </Link>

      <ConfirmModal
        open={confirmOpen}
        title="Delete event?"
        message="This action cannot be undone. The event will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
