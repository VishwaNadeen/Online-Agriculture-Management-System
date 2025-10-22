// src/pages/Admin/EventAdmin.jsx
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BiEdit, BiPlus, BiTrash } from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import AdminLoader from "../components/AdminLoader";
import { createGreenGrowLetterShell } from "../utils/pdf/greenGrowLetterShell";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Initial load
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

    if (hasFreshCache) {
      fetchData(false);
    } else if (!eventsCache) {
      fetchData(true);
    } else {
      fetchData(false);
    }

    return () => {
      cancelled = true;
    };
  }, [hasFreshCache]);

  const confirmDelete = useCallback((id) => {
    if (!id) return;
    // Optimistic update
    setEvents((prev) => prev.filter((e) => e._id !== id));
    if (eventsCache) {
      eventsCache = eventsCache.filter((e) => e._id !== id);
      eventsCacheTime = Date.now();
    }
    axios
      .delete(`${BASE_URL}/events/${id}`)
      .then(() => {
        toast.success("Event deleted");
      })
      .catch((err) => {
        console.error("Delete failed", err);
        toast.error("Failed to delete event...");
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
  }, []);

  // Helper to format dates consistently
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // PDF generation
  const downloadPDF = async () => {
    try {
      if (isLoading) {
        toast.error("Please wait until data loads");
        return;
      }
      if (!Array.isArray(events) || events.length === 0) {
        toast.error("No data to export");
        return;
      }

      setIsDownloading(true);

      const nowStr = new Date().toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      const SITE_NAME = import.meta.env.VITE_SITE_NAME || "Green Grow";

      const { doc, margins, contentWidth, addPage, save } =
        await createGreenGrowLetterShell({
          brandName: SITE_NAME,
          brandAccent: [4, 120, 87],
          brandPrimary: [17, 24, 39],
          addressLines: ["123 Harvest Lane, Agricultural District, Colombo 05, Sri Lanka"],
          contactLine: "Contact: +94 11 234 5678",
          emailLine: "Email: support@greengrow.lk",
          rightTitle: "EVENTS REPORT",
          rightSubTitle: `Generated on ${nowStr}`,
          footerNoteLeft: "This is a computer-generated report.",
          footerNoteRight: "greengrow.lk | +94 11 234 5678",
        });

      // ===== Body =====
      let y = Math.max(margins.top, 36);
      const pageH = doc.internal.pageSize.getHeight();
      const pageW = doc.internal.pageSize.getWidth();

      // Title (center)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text(`${SITE_NAME} — Events Summary`, pageW / 2, y, { align: "center" });
      y += 8;

      // Divider (center)
      doc.setDrawColor(4, 120, 87);
      doc.setLineWidth(0.6);
      const dividerWidth = contentWidth * 0.6;
      const dividerX = (pageW - dividerWidth) / 2;
      doc.line(dividerX, y, dividerX + dividerWidth, y);
      y += 10;

      // Summary (center)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      const totalEvents = events.length;
      const now = new Date();
      const upcomingEvents = events.filter((e) => new Date(e.date) > now).length;
      const pastEvents = totalEvents - upcomingEvents;
      const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);

      doc.text(`Total Events: ${totalEvents}`, pageW / 2, y, { align: "center" });
      y += 6;
      doc.text(
        `Upcoming: ${upcomingEvents}    Past: ${pastEvents}    Total Capacity: ${totalCapacity}`,
        pageW / 2,
        y,
        { align: "center" }
      );
      y += 12;

      // Table
      if (y > pageH - margins.bottom - 20) {
        addPage();
        y = Math.max(margins.top, 36);
      }

      const head = [
        ["#", "Title", "Category", "Trainer", "Date", "Time", "Location", "Capacity", "Deadline"],
      ];
      const body = events.map((e, i) => [
        String(i + 1),
        e?.title ?? "",
        e?.category ?? "",
        e?.trainerName ?? "",
        formatDate(e?.date),
        e?.time ?? "",
        e?.location ?? "",
        e?.capacity ?? "",
        formatDate(e?.registrationDeadline),
      ]);

      // ✅ Use symmetric margins just for the table so it centers on the page
      const side = 28; // tweak as you like; equal left/right = centered

      doc.setFontSize(10);
      // slightly offset the table to the right
doc.autoTable({
  startY: y,
  head,
  body,
  styles: {
    fontSize: 8,
    cellPadding: 3,
    overflow: "linebreak",
    textColor: [17, 24, 39],
    halign: "left",
  },
  headStyles: {
    fillColor: [236, 253, 245],
    textColor: [4, 120, 87],
    lineWidth: 0.2,
    lineColor: [209, 213, 219],
    fontStyle: "bold",
    halign: "center",
  },
  alternateRowStyles: { fillColor: [249, 250, 251] },
  columnStyles: {
    0: { cellWidth: 12, halign: "center" },
    1: { cellWidth: 50 },
    2: { cellWidth: 30 },
    3: { cellWidth: 35 },
    4: { cellWidth: 25, halign: "center" },
    5: { cellWidth: 20, halign: "center" },
    6: { cellWidth: 35 },
    7: { cellWidth: 20, halign: "center" },
    8: { cellWidth: 25, halign: "center" },
  },
  theme: "striped",

  // ✅ shift table slightly right
  margin: { left: 18, right: 42 },
  tableWidth: "auto",
});

      save(`${SITE_NAME.replace(/\s+/g, "_")}_Events_Report.pdf`);
      toast.success(`PDF downloaded successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("PDF download failed.");
    } finally {
      setIsDownloading(false);
    }
  };

  const rows = useMemo(() => {
    const eventsList = events || [];
    if (!searchTerm.trim()) return eventsList;
    
    const search = searchTerm.toLowerCase();
    return eventsList.filter(event => 
      event.title?.toLowerCase().includes(search) ||
      event.description?.toLowerCase().includes(search) ||
      event.category?.toLowerCase().includes(search) ||
      event.trainerName?.toLowerCase().includes(search) ||
      event.location?.toLowerCase().includes(search)
    );
  }, [events, searchTerm]);

  if (isLoading) {
    return <AdminLoader message="Loading events data..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-6 sm:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 bg-clip-text text-transparent mb-3">
                Events Management
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Manage and organize all your events, workshops, and training sessions.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {isRefreshing && (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                  <span>Updating...</span>
                </div>
              )}
              <button
                onClick={downloadPDF}
                disabled={isDownloading || isLoading}
                className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
              >
                <div className="flex items-center gap-2">
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download PDF</span>
                    </>
                  )}
                </div>
              </button>
              <button
                onClick={() => fetchData(true)}
                disabled={isRefreshing || isLoading}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                <div className="flex items-center gap-2">
                  {isRefreshing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events by title, description, category, trainer, or location..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/50 transition-all duration-300 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-emerald-700">{rows.length}</span> event{rows.length !== 1 ? 's' : ''}
            {searchTerm && (
              <span className="ml-2 text-gray-500">
                (filtered from {events.length} total)
              </span>
            )}
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Events Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-[1100px] w-full">
              <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-200/50">
                <tr className="text-left">
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Title</th>
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Category</th>
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Trainer</th>
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Date</th>
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Time</th>
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Location</th>
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Capacity</th>
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Deadline</th>
                  <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Actions</th>
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
                      className="group border-b border-emerald-100/50 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-transparent transition-all duration-300"
                    >
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {title}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {category}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-700">{trainerName}</td>
                      <td className="p-4 text-sm text-gray-700">{dateStr}</td>
                      <td className="p-4 text-sm text-gray-700">{time}</td>
                      <td className="p-4 text-sm text-gray-700">{location}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                          {capacity}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-700">{deadlineStr}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => confirmDelete(_id)}
                            className="group/btn relative p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-red-500/20"
                            title="Delete Event"
                          >
                            <BiTrash className="text-lg group-hover/btn:scale-110 transition-transform duration-200" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/event/${_id}/editevent`)}
                            className="group/btn relative p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                            title="Edit Event"
                          >
                            <BiEdit className="text-lg group-hover/btn:scale-110 transition-transform duration-200" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 &&
                  Array.from({ length: isLoading ? 5 : 0 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="border-b border-emerald-100/50">
                      <td className="p-4"><div className="h-4 w-40 bg-gray-200 rounded-lg animate-pulse" /></td>
                      <td className="p-4"><div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" /></td>
                      <td className="p-4"><div className="h-4 w-32 bg-gray-200 rounded-lg animate-pulse" /></td>
                      <td className="p-4"><div className="h-4 w-24 bg-gray-200 rounded-lg animate-pulse" /></td>
                      <td className="p-4"><div className="h-4 w-16 bg-gray-200 rounded-lg animate-pulse" /></td>
                      <td className="p-4"><div className="h-4 w-28 bg-gray-200 rounded-lg animate-pulse" /></td>
                      <td className="p-4"><div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse mx-auto" /></td>
                      <td className="p-4"><div className="h-4 w-24 bg-gray-200 rounded-lg animate-pulse" /></td>
                      <td className="p-4"><div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse" /></td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {rows.length === 0 && !isLoading && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? "No events match your search" : "No events found"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm 
                    ? "Try adjusting your search criteria or clear the search to see all events."
                    : "Get started by creating your first event."
                  }
                </p>
                {!searchTerm && (
                  <Link
                    to="/admin/addevent"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <BiPlus className="w-4 h-4 mr-2" />
                    Create Event
                  </Link>
                )}
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <Link
        to={"/admin/addevent"}
        className="group fixed bottom-6 right-6 px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl shadow-2xl shadow-emerald-500/25 hover:shadow-3xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 flex items-center gap-3"
      >
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
          <BiPlus className="text-xl" />
        </div>
        <span className="font-semibold hidden sm:block tracking-wide">Add Event</span>
      </Link>
    </div>
  );
}
