// src/pages/Admin/CoursesReport.jsx
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Loader from "../components/loader";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const SITE_NAME = import.meta.env.VITE_SITE_NAME || "Green Grow";

export default function CoursesReport() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/courses`)
      .then((res) => {
        setCourses(res.data || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load courses", err);
        toast.error("Failed to load courses");
        setIsLoading(false);
      });
  }, []);

  const reportStats = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => c?.isPublished).length;
    const active = courses.filter((c) => c?.isActive).length;

    const totals = courses.reduce(
      (acc, c) => {
        acc.videos += Array.isArray(c?.videoTutorials) ? c.videoTutorials.length : 0;
        acc.pdfs += Array.isArray(c?.pdfLessons) ? c.pdfLessons.length : 0;
        acc.texts += Array.isArray(c?.textLessons) ? c.textLessons.length : 0;
        return acc;
      },
      { videos: 0, pdfs: 0, texts: 0 }
    );

    return { total, published, active, totals };
  }, [courses]);

  // ---------- Load jsPDF + autoTable only when needed ----------
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

  // ============== Report generation (direct PDF download) ==============
  async function downloadPDF() {
    try {
      if (isLoading) {
        toast.error("Please wait until data loads");
        return;
      }
      if (!Array.isArray(courses) || courses.length === 0) {
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

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(SITE_NAME, left, y);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Courses Report", left, (y += 8));
      doc.setFontSize(10);
      doc.text(`Generated on: ${nowStr}`, pageWidth - left, 16, { align: "right" });

      // Divider
      y += 6;
      doc.setDrawColor(200);
      doc.line(left, y, pageWidth - left, y);
      y += 6;

      // Summary
      doc.setFontSize(11);
      doc.text(`Total Courses: ${reportStats.total}`, left, y);
      y += 6;
      doc.text(`Published: ${reportStats.published}`, left, y);
      y += 6;
      doc.text(`Active: ${reportStats.active}`, left, y);
      y += 6;
      doc.text(
        `Materials — Videos: ${reportStats.totals.videos}, PDFs: ${reportStats.totals.pdfs}, Texts: ${reportStats.totals.texts}`,
        left,
        y
      );
      y += 8;

      // Table
      const head = [
        [
          "#",
          "Course ID",
          "Name",
          "Category",
          "Level",
          "Lang",
          "Videos",
          "PDFs",
          "Texts",
          "Published",
          "Active",
        ],
      ];

      const body = courses.map((c, i) => [
        String(i + 1),
        c?.courseID ?? "",
        c?.courseName ?? "",
        c?.category ?? "",
        c?.level ?? "",
        (c?.language ?? "").toUpperCase(),
        Array.isArray(c?.videoTutorials) ? c.videoTutorials.length : 0,
        Array.isArray(c?.pdfLessons) ? c.pdfLessons.length : 0,
        Array.isArray(c?.textLessons) ? c.textLessons.length : 0,
        String(!!c?.isPublished),
        String(!!c?.isActive),
      ]);

      doc.setFontSize(10);
      doc.autoTable({
        startY: y,
        head,
        body,
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [235, 250, 244], textColor: 0 },
        columnStyles: {
          0: { cellWidth: 10 }, // #
          1: { cellWidth: 26 }, // Course ID
          2: { cellWidth: 40 }, // Name
          3: { cellWidth: 28 }, // Category
          4: { cellWidth: 20 }, // Level
          5: { cellWidth: 14 }, // Lang
          6: { cellWidth: 16 }, // Videos
          7: { cellWidth: 14 }, // PDFs
          8: { cellWidth: 14 }, // Texts
          9: { cellWidth: 20 }, // Published
          10: { cellWidth: 16 }, // Active
        },
        theme: "striped",
      });

      // Signature block
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

      // signature lines
      doc.line(left, sigY + 18, left + 60, sigY + 18);
      doc.line(pageWidth - left - 60, sigY + 18, pageWidth - left, sigY + 18);

      doc.setFontSize(9);
      doc.text(`${SITE_NAME} Admin`, left, sigY + 24);

      // Footer note
      const noteY = sigY + 34;
      const note = `This report was generated by ${SITE_NAME}. Data reflects the current state of the courses catalog as of ${nowStr}.`;
      doc.setTextColor(60);
      doc.text(doc.splitTextToSize(note, pageWidth - left * 2), left, noteY);

      // Save
      const dt = new Date();
      const ts = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
        dt.getDate()
      ).padStart(2, "0")}_${String(dt.getHours()).padStart(2, "0")}${String(dt.getMinutes()).padStart(2, "0")}`;
      const filename = `${SITE_NAME.replace(/\s+/g, "_")}_Courses_Report_${ts}.pdf`;

      doc.save(filename);
      toast.success(`PDF downloaded as "${filename}". Saved to your default Downloads folder.`);
    } catch (err) {
      console.error(err);
      toast.error("PDF download failed.");
    } finally {
      setIsDownloading(false);
    }
  }

  // For on-page display only
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
        {/* Header actions */}
        <div className="flex items-center justify-between mb-4">
          <a
            href="/admin/courses"
            className="px-4 py-2 bg-white text-emerald-800 rounded-[10px] border border-emerald-300 shadow-sm hover:bg-emerald-50"
          >
            Back to Courses
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

        {/* Simple on-screen preview (does not affect PDF generation) */}
        <div className="paper bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-900">
                  {SITE_NAME}
                </h1>
                <p className="text-sm text-emerald-700">Courses Report</p>
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
                <div className="text-xs text-emerald-700">Total Courses</div>
                <div className="text-2xl font-bold text-emerald-900">{reportStats.total}</div>
              </div>
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50">
                <div className="text-xs text-emerald-700">Published</div>
                <div className="text-2xl font-bold text-emerald-900">{reportStats.published}</div>
              </div>
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50">
                <div className="text-xs text-emerald-700">Active</div>
                <div className="text-2xl font-bold text-emerald-900">{reportStats.active}</div>
              </div>
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50">
                <div className="text-xs text-emerald-700">Materials (Videos / PDFs / Texts)</div>
                <div className="text-lg font-semibold text-emerald-900">
                  {reportStats.totals.videos} / {reportStats.totals.pdfs} / {reportStats.totals.texts}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="rounded-xl border border-emerald-100 overflow-hidden">
              <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 text-emerald-900 font-semibold">
                Course Details
              </div>
              {isLoading ? (
                <div className="p-10 flex justify-center bg-gray-50">
                  <Loader />
                </div>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-[900px] w-full">
                    <thead className="bg-white">
                      <tr className="text-left text-emerald-900">
                        <th className="p-3 text-xs font-semibold">#</th>
                        <th className="p-3 text-xs font-semibold">Course ID</th>
                        <th className="p-3 text-xs font-semibold">Name</th>
                        <th className="p-3 text-xs font-semibold">Category</th>
                        <th className="p-3 text-xs font-semibold">Level</th>
                        <th className="p-3 text-xs font-semibold">Lang</th>
                        <th className="p-3 text-xs font-semibold">Videos</th>
                        <th className="p-3 text-xs font-semibold">PDFs</th>
                        <th className="p-3 text-xs font-semibold">Texts</th>
                        <th className="p-3 text-xs font-semibold">Published</th>
                        <th className="p-3 text-xs font-semibold">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((c, i) => {
                        const videos = Array.isArray(c?.videoTutorials) ? c.videoTutorials.length : 0;
                        const pdfs = Array.isArray(c?.pdfLessons) ? c.pdfLessons.length : 0;
                        const texts = Array.isArray(c?.textLessons) ? c.textLessons.length : 0;

                        return (
                          <tr key={i} className="border-t border-emerald-100">
                            <td className="p-3 text-sm text-emerald-900">{i + 1}</td>
                            <td className="p-3 text-sm text-emerald-900">{c?.courseID}</td>
                            <td className="p-3 text-sm text-emerald-900">{c?.courseName}</td>
                            <td className="p-3 text-sm text-emerald-700">{c?.category || "-"}</td>
                            <td className="p-3 text-sm text-emerald-700">{c?.level || "-"}</td>
                            <td className="p-3 text-sm text-emerald-700 uppercase">{c?.language || "-"}</td>
                            <td className="p-3 text-sm text-emerald-700 text-center">{videos}</td>
                            <td className="p-3 text-sm text-emerald-700 text-center">{pdfs}</td>
                            <td className="p-3 text-sm text-emerald-700 text-center">{texts}</td>
                            <td className="p-3 text-sm">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  c?.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {String(!!c?.isPublished)}
                              </span>
                            </td>
                            <td className="p-3 text-sm">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  c?.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {String(!!c?.isActive)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {courses.length === 0 && (
                        <tr>
                          <td colSpan={11} className="p-4 text-sm text-emerald-800">
                            No data
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50 border-t border-emerald-100">
                        <td className="p-3 text-xs font-semibold text-emerald-900" colSpan={6}>
                          Totals
                        </td>
                        <td className="p-3 text-xs font-semibold text-emerald-900 text-center">
                          {reportStats.totals.videos}
                        </td>
                        <td className="p-3 text-xs font-semibold text-emerald-900 text-center">
                          {reportStats.totals.pdfs}
                        </td>
                        <td className="p-3 text-xs font-semibold text-emerald-900 text-center">
                          {reportStats.totals.texts}
                        </td>
                        <td className="p-3 text-xs font-semibold text-emerald-900 text-center" colSpan={2}>
                          —
                        </td>
                      </tr>
                    </tfoot>
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
              This report was generated by {SITE_NAME}. Data reflects the current state of the courses catalog as of{" "}
              {nowStr}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
