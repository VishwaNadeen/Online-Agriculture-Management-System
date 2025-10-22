// src/pages/Admin/CoursesReport.jsx
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Loader from "../components/loader";
import { createGreenGrowLetterShell } from "../utils/pdf/greenGrowLetterShell";

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

  // PDF generation function
  const downloadPDF = async () => {
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

      const nowStr = new Date().toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      const { doc, margins, contentWidth, addPage, save } =
        await createGreenGrowLetterShell({
          brandName: SITE_NAME,
          brandAccent: [4, 120, 87],
          brandPrimary: [17, 24, 39],
          addressLines: ["123 Harvest Lane, Agricultural District, Colombo 05, Sri Lanka"],
          contactLine: "Contact: +94 11 234 5678",
          emailLine: "Email: support@greengrow.lk",
          rightTitle: "COURSES REPORT",
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
      doc.text(`${SITE_NAME} — Courses Summary`, pageW / 2, y, { align: "center" });
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

      doc.text(`Total Courses: ${reportStats.total}`, pageW / 2, y, { align: "center" });
      y += 6;
      doc.text(
        `Published: ${reportStats.published}    Active: ${reportStats.active}`,
        pageW / 2,
        y,
        { align: "center" }
      );
      y += 6;
      doc.text(
        `Videos: ${reportStats.totals.videos}    PDFs: ${reportStats.totals.pdfs}    Texts: ${reportStats.totals.texts}`,
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
        ["#", "Course ID", "Name", "Category", "Level", "Language", "Videos", "PDFs", "Texts", "Published", "Active"],
      ];
      const body = courses.map((c, i) => [
        String(i + 1),
        c?.courseID ?? "",
        c?.courseName ?? "",
        c?.category ?? "",
        c?.level ?? "",
        c?.language ?? "",
        Array.isArray(c?.videoTutorials) ? c.videoTutorials.length : 0,
        Array.isArray(c?.pdfLessons) ? c.pdfLessons.length : 0,
        Array.isArray(c?.textLessons) ? c.textLessons.length : 0,
        c?.isPublished ? "Yes" : "No",
        c?.isActive ? "Yes" : "No",
      ]);

      doc.setFontSize(10);
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
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 20, halign: "center" },
          2: { cellWidth: 50 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20, halign: "center" },
          6: { cellWidth: 15, halign: "center" },
          7: { cellWidth: 15, halign: "center" },
          8: { cellWidth: 15, halign: "center" },
          9: { cellWidth: 20, halign: "center" },
          10: { cellWidth: 20, halign: "center" },
        },
        theme: "striped",
        margin: { left: 18, right: 42 },
        tableWidth: "auto",
      });

      save(`${SITE_NAME.replace(/\s+/g, "_")}_Courses_Report.pdf`);
      toast.success(`PDF downloaded successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("PDF download failed.");
    } finally {
      setIsDownloading(false);
    }
  };

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
    <div className="w-full min-h-screen">
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
