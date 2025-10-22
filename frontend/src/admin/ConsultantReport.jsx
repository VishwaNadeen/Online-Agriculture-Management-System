import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Loader from "../components/loader";
import { ApptAPI } from "../api/appointments";
import { ConsultantAPI } from "../api/consultants";

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

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const exists = Array.from(document.getElementsByTagName("script")).some(
        (s) => s.src && s.src.includes(src)
      );
      if (exists) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(s);
    });
  }

  async function ensurePdfLibs() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    }
    if (!window.jspdf?.jsPDF?.API?.autoTable) {
      await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"
      );
    }
    if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.jsPDF.API?.autoTable) {
      throw new Error("PDF libraries failed to load");
    }
  }

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
      await ensurePdfLibs();

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

      const left = 14;
      let y = 16;
      const nowStr = new Date().toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(SITE_NAME, left, y);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Consultant Appointments Report", left, (y += 8));
      doc.setFontSize(10);
      const who = me?.name ? `${me.name} (${me.email || "-"})` : "Admin";
      doc.text(`Generated on: ${nowStr}`, pageWidth - left, 16, { align: "right" });
      doc.text(`Prepared for: ${who}`, pageWidth - left, 22, { align: "right" });

      y += 6;
      doc.setDrawColor(200);
      doc.line(left, y, pageWidth - left, y);
      y += 6;

      doc.setFontSize(11);
      doc.text(`Total Requests: ${stats.total}`, left, y);
      y += 6;
      doc.text(`Confirmed: ${stats.confirmed}`, left, y);
      y += 6;
      doc.text(`Completed: ${stats.completed}`, left, y);
      y += 6;
      doc.text(`Unique Clients: ${stats.uniqueClients}`, left, y);
      y += 8;

      const head = [
        [
          "#",
          "Appt ID",
          "Status",
          "Client",
          "Email",
          "Phone",
          "City",
          "Category",
          "Date",
          "Time",
          "Hours",
        ],
      ];

      const body = items.map((a, i) => [
        String(i + 1),
        a?.appointmentId ?? "",
        a?.status ?? "",
        a?.name ?? "",
        a?.email ?? "",
        a?.phone ?? "",
        a?.city ?? "",
        a?.category ?? "",
        a?.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : "",
        a?.appointmentTime ?? "",
        a?.durationHours ?? "",
      ]);

      doc.setFontSize(10);
      doc.autoTable({
        startY: y,
        head,
        body,
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [235, 250, 244], textColor: 0 },
        theme: "striped",
      });

      let sigY = doc.lastAutoTable.finalY + 12;
      const pageHeight = doc.internal.pageSize.getHeight();
      if (sigY + 40 > pageHeight) {
        doc.addPage();
        sigY = 20;
      }

      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text("Prepared by:", left, sigY);
      doc.text("Authorized Signature:", pageWidth - left - 60, sigY);
      doc.line(left, sigY + 18, left + 60, sigY + 18);
      doc.line(pageWidth - left - 60, sigY + 18, pageWidth - left, sigY + 18);
      doc.setFontSize(9);
      doc.text(`${SITE_NAME} Admin`, left, sigY + 24);

      const dt = new Date();
      const ts = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
        dt.getDate()
      ).padStart(2, "0")}_${String(dt.getHours()).padStart(2, "0")}${String(dt.getMinutes()).padStart(2, "0")}`;
      const filename = `${SITE_NAME.replace(/\s+/g, "_")}_Consultant_Appointments_Report_${ts}.pdf`;

      doc.save(filename);
      toast.success(`PDF downloaded as "${filename}". Saved to your default Downloads folder.`);
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
