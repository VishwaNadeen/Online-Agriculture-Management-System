import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Loader from "../components/loader";
import { ApptAPI } from "../api/appointments";
import { ConsultantAPI } from "../api/consultants";
import { createGreenGrowLetterShell } from "../utils/pdf/greenGrowLetterShell";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const SITE_NAME = import.meta.env.VITE_SITE_NAME || "Green Grow";

export default function ConsultantReport() {
  const [items, setItems] = useState([]);
  const [me, setMe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    Promise.all([
      ApptAPI.listAll().catch(() => []),
      ConsultantAPI.getMe().catch(() => null),
    ])
      .then(([appts, meRes]) => {
        setItems(Array.isArray(appts) ? appts : []);
        setMe(meRes);
      })
      .catch(() => {
        toast.error("Failed to load consultant report data");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const confirmed = items.filter((a) => a.status === "confirmed").length;
    const completed = items.filter((a) => a.status === "completed").length;
    const uniqueClients = new Set(items.map((a) => String(a.userId || ""))).size;
    return { total, confirmed, completed, uniqueClients };
  }, [items]);

  // Helper function to format dates consistently
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

  async function downloadPDF() {
    try {
      if (isLoading) {
        toast.error("Please wait until data loads");
        return;
      }
      if (!Array.isArray(items) || items.length === 0) {
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

      const { doc, margins, contentWidth, addPage, save } = await createGreenGrowLetterShell({
        brandName: SITE_NAME,
        brandAccent: [4, 120, 87],
        brandPrimary: [17, 24, 39],
        addressLines: ["123 Harvest Lane, Agricultural District, Colombo 05, Sri Lanka"],
        contactLine: "Contact: +94 11 234 5678",
        emailLine: "Email: support@greengrow.lk",
        rightTitle: "Consultant Report",
        rightSubTitle: `Generated on ${nowStr}`,
        footerNoteLeft: "This is a computer-generated report.",
        footerNoteRight: "greengrow.lk | +94 11 234 5678",
      });

      // ===== Body =====
      let y = Math.max(margins.top, 36);
      const x = margins.left;
      const pageH = doc.internal.pageSize.getHeight();

      // Section title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text(`${SITE_NAME} — Consultant Appointments Summary`, x, y); y += 6;

      // Divider
      doc.setDrawColor(4, 120, 87);
      doc.setLineWidth(0.6);
      doc.line(x, y, x + contentWidth, y); y += 7;

      // Summary statistics
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Total Appointments: ${stats.total}`, x, y); y += 5;
      doc.text(`Confirmed: ${stats.confirmed}    Completed: ${stats.completed}    Unique Clients: ${stats.uniqueClients}`, x, y); y += 9;

      // Appointments table
      if (y > (pageH - margins.bottom - 20)) { addPage(); y = Math.max(margins.top, 36); }
      const head = [["#", "Appt ID", "Status", "Client", "Email", "Phone", "City", "Category", "Date", "Time", "Hours"]];
      const body = items.map((a, i) => [
        String(i + 1),
        a?.appointmentId ?? "",
        (a?.status ?? "").toUpperCase(),
        a?.name ?? "",
        a?.email ?? "",
        a?.phone ?? "",
        a?.city ?? "",
        a?.category ?? "",
        formatDate(a?.appointmentDate),
        a?.appointmentTime ?? "",
        a?.durationHours ?? "",
      ]);

      doc.setFontSize(10);
      doc.autoTable({
        startY: y,
        head,
        body,
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [236, 253, 245], textColor: [4, 120, 87], lineWidth: 0.2, lineColor: [209, 213, 219] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 35 },
          4: { cellWidth: 40 },
          5: { cellWidth: 25 },
          6: { cellWidth: 20 },
          7: { cellWidth: 25 },
          8: { cellWidth: 20 },
          9: { cellWidth: 15 },
          10: { cellWidth: 12 },
        },
        theme: "striped",
        margin: { left: margins.left, right: margins.right },
      });

      save(`${SITE_NAME.replace(/\s+/g, "_")}_Consultant_Appointments_Report.pdf`);
      toast.success(`PDF downloaded successfully! Saved to your default Downloads folder.`);
    } catch (err) {
      console.error(err);
      toast.error("PDF download failed.");
    } finally {
      setIsDownloading(false);
    }
  }

  const nowStr = useMemo(
    () =>
      new Date().toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-6 sm:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 bg-clip-text text-transparent mb-3">
                Consultant Report
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Comprehensive overview of consultant appointments and performance metrics.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <a
                href="/admin/consultant"
                className="group relative px-6 py-3 bg-white/80 backdrop-blur-sm text-emerald-700 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 border border-emerald-200/50"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Consultant</span>
                </div>
              </a>
              <button
                onClick={downloadPDF}
                disabled={isDownloading || isLoading}
                className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
              >
                <div className="flex items-center gap-2">
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Preparing PDF...</span>
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
            </div>
          </div>
        </div>

        {/* Report Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-emerald-100/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent mb-2">
                  {SITE_NAME}
                </h2>
                <p className="text-lg text-gray-600">Consultant Appointments Report</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Generated on</div>
                <div className="text-lg font-semibold text-gray-900">{nowStr}</div>
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-6 border border-emerald-200/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="text-sm font-medium text-emerald-700 mb-1">Total Requests</div>
                <div className="text-3xl font-bold text-emerald-900">{stats.total}</div>
              </div>
              <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-200/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-sm font-medium text-blue-700 mb-1">Confirmed</div>
                <div className="text-3xl font-bold text-blue-900">{stats.confirmed}</div>
              </div>
              <div className="group relative bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 border border-green-200/50 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="text-sm font-medium text-green-700 mb-1">Completed</div>
                <div className="text-3xl font-bold text-green-900">{stats.completed}</div>
              </div>
              <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border border-purple-200/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-sm font-medium text-purple-700 mb-1">Unique Clients</div>
                <div className="text-3xl font-bold text-purple-900">{stats.uniqueClients}</div>
              </div>
            </div>
          </div>

          <div className="px-8 pb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-lg">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-200/50">
                <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Appointment Details
                </h3>
              </div>
              {isLoading ? (
                <div className="p-12 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/50">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                  </div>
                  <p className="text-lg font-medium text-gray-600">Loading appointment data...</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-[1000px] w-full">
                    <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100/50">
                      <tr className="text-left">
                        <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">#</th>
                        <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Appt ID</th>
                        <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Status</th>
                        <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Client</th>
                        <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Email</th>
                        <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Phone</th>
                        <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">City</th>
                        <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Category</th>
                        <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Date</th>
                        <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Time</th>
                        <th className="p-4 text-sm font-bold text-emerald-800 tracking-wide">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((a, i) => (
                        <tr key={a?._id || i} className="group border-b border-emerald-100/50 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-transparent transition-all duration-300">
                          <td className="p-4 text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">{i + 1}</td>
                          <td className="p-4 text-sm text-gray-700 font-mono">{a?.appointmentId || ""}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              a?.status === 'completed' 
                                ? 'bg-green-100 text-green-800 border border-green-300/50'
                                : a?.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300/50'
                                : 'bg-gray-100 text-gray-700 border border-gray-300/50'
                            }`}>
                              {a?.status || ""}
                            </span>
                          </td>
                          <td className="p-4 text-sm font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">{a?.name || ""}</td>
                          <td className="p-4 text-sm text-gray-600">{a?.email || "-"}</td>
                          <td className="p-4 text-sm text-gray-600">{a?.phone || "-"}</td>
                          <td className="p-4 text-sm text-gray-600">{a?.city || "-"}</td>
                          <td className="p-4 text-sm text-gray-600">{a?.category || "-"}</td>
                          <td className="p-4 text-sm text-gray-600">{a?.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : ""}</td>
                          <td className="p-4 text-sm text-gray-600">{a?.appointmentTime || ""}</td>
                          <td className="p-4 text-sm text-gray-600">{a?.durationHours ?? ""}</td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={11} className="p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments found</h3>
                            <p className="text-gray-600">No appointment data is available for this report.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="px-8 pb-8">
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-2xl p-6 border border-emerald-200/50">
                <div className="text-sm font-medium text-emerald-700 mb-4">Prepared by</div>
                <div className="mt-6 border-t border-emerald-300/50 pt-4">
                  <div className="text-lg font-bold text-emerald-900 mb-1">{SITE_NAME} Admin</div>
                  <div className="text-sm text-emerald-600">Digital Signature</div>
                </div>
              </div>
              <div className="md:text-right">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl p-6 border border-blue-200/50">
                  <div className="text-sm font-medium text-blue-700 mb-4">Authorized Signature</div>
                  <div className="mt-6 border-t border-blue-300/50 pt-4 inline-block">
                    <div className="text-lg font-bold text-blue-900 mb-1">__________________________</div>
                    <div className="text-sm text-blue-600">Date: {nowStr}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50">
              <div className="text-sm text-gray-600 leading-relaxed">
                <strong>Report Information:</strong> This report was generated by {SITE_NAME} on {nowStr}. 
                Data reflects the current state of consultant appointments and is subject to real-time updates. 
                For the most current information, please refer to the live system.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
