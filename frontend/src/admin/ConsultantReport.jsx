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
    <div className="w-full min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <a
            href="/admin/consultant"
            className="px-4 py-2 bg-white text-emerald-800 rounded-[10px] border border-emerald-300 shadow-sm hover:bg-emerald-50"
          >
            Back to Consultant
          </a>
          <button
            onClick={downloadPDF}
            disabled={isDownloading || isLoading}
            className={`px-4 py-2 rounded-[10px] border shadow-lg transition transform duration-200 active:scale-95 ${
              isDownloading || isLoading
                ? "bg-emerald-400 text-white border-emerald-400 cursor-not-allowed"
                : "bg-emerald-700 text-white border-emerald-600/50 hover:shadow-emerald-700/30 hover:scale-[1.02]"
            }`}
          >
            {isDownloading ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>

        <div className="paper bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-900">{SITE_NAME}</h1>
                <p className="text-sm text-emerald-700">Consultant Appointments Report</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-600">Generated on</div>
                <div className="text-sm font-medium text-emerald-900">{nowStr}</div>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50">
                <div className="text-xs text-emerald-700">Total Requests</div>
                <div className="text-2xl font-bold text-emerald-900">{stats.total}</div>
              </div>
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50">
                <div className="text-xs text-emerald-700">Confirmed</div>
                <div className="text-2xl font-bold text-emerald-900">{stats.confirmed}</div>
              </div>
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50">
                <div className="text-xs text-emerald-700">Completed</div>
                <div className="text-2xl font-bold text-emerald-900">{stats.completed}</div>
              </div>
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50">
                <div className="text-xs text-emerald-700">Unique Clients</div>
                <div className="text-2xl font-bold text-emerald-900">{stats.uniqueClients}</div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="rounded-xl border border-emerald-100 overflow-hidden">
              <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 text-emerald-900 font-semibold">
                Appointment Details
              </div>
              {isLoading ? (
                <div className="p-10 flex justify-center bg-gray-50">
                  <Loader />
                </div>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-[1000px] w-full">
                    <thead className="bg-white">
                      <tr className="text-left text-emerald-900">
                        <th className="p-3 text-xs font-semibold">#</th>
                        <th className="p-3 text-xs font-semibold">Appt ID</th>
                        <th className="p-3 text-xs font-semibold">Status</th>
                        <th className="p-3 text-xs font-semibold">Client</th>
                        <th className="p-3 text-xs font-semibold">Email</th>
                        <th className="p-3 text-xs font-semibold">Phone</th>
                        <th className="p-3 text-xs font-semibold">City</th>
                        <th className="p-3 text-xs font-semibold">Category</th>
                        <th className="p-3 text-xs font-semibold">Date</th>
                        <th className="p-3 text-xs font-semibold">Time</th>
                        <th className="p-3 text-xs font-semibold">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((a, i) => (
                        <tr key={a?._id || i} className="border-t border-emerald-100">
                          <td className="p-3 text-sm text-emerald-900">{i + 1}</td>
                          <td className="p-3 text-sm text-emerald-900">{a?.appointmentId || ""}</td>
                          <td className="p-3 text-sm text-emerald-900 capitalize">{a?.status || ""}</td>
                          <td className="p-3 text-sm text-emerald-900">{a?.name || ""}</td>
                          <td className="p-3 text-sm text-emerald-700">{a?.email || "-"}</td>
                          <td className="p-3 text-sm text-emerald-700">{a?.phone || "-"}</td>
                          <td className="p-3 text-sm text-emerald-700">{a?.city || "-"}</td>
                          <td className="p-3 text-sm text-emerald-700">{a?.category || "-"}</td>
                          <td className="p-3 text-sm text-emerald-700">{a?.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : ""}</td>
                          <td className="p-3 text-sm text-emerald-700">{a?.appointmentTime || ""}</td>
                          <td className="p-3 text-sm text-emerald-700">{a?.durationHours ?? ""}</td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={11} className="p-4 text-sm text-emerald-800">No data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 pb-8">
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-emerald-800">Prepared by</div>
                <div className="mt-8 border-t border-emerald-200 pt-2">
                  <div className="text-sm font-semibold text-emerald-900">{SITE_NAME} Admin</div>
                  <div className="text-xs text-emerald-700">Signature</div>
                </div>
              </div>
              <div className="md:text-right">
                <div className="text-sm text-emerald-800">Authorized Signature</div>
                <div className="mt-8 border-t border-emerald-200 pt-2 inline-block">
                  <div className="text-sm font-semibold text-emerald-900">__________________________</div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-[11px] text-emerald-700">
              This report was generated by {SITE_NAME}. Data reflects the current state of consultant appointments as of {nowStr}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
