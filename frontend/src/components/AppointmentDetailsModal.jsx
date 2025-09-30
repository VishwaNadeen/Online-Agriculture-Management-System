// src/components/AppointmentDetailsModal.jsx
import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { downloadElementAsPdf } from "../utils/pdf";

export default function AppointmentDetailsModal({
  open,
  onClose,
  appt,
  consultant,
  onEdit,
  onCancel,
  canCancel,
  autoDownload = false,
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef(null);
  const scrollRef = useRef(null);
  if (!open) return null;

  const dateStr = (() => {
    const d = appt.appointmentDate || appt.appointmentDateISO;
    if (!d) return "-";
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  })();

  const apptNo = appt.appointmentId ? `#${String(appt.appointmentId).padStart(5, "0")}` : "-";

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    const input = printRef.current;
    const scroller = scrollRef.current || input?.parentElement;

    if (!input) {
      alert("Unable to find content to export.");
      setIsGeneratingPdf(false);
      return;
    }

    // Temporarily expand the scroll area so the full content renders
    const prevOverflow = scroller?.style.overflow;
    const prevMaxH = scroller?.style.maxHeight;
    if (scroller) {
      scroller.style.overflow = "visible";
      scroller.style.maxHeight = "none";
    }

    try {
      // allow layout/reflow
      await new Promise((res) => setTimeout(res, 50));

      // Ensure images and fonts in the capture area are ready
      await waitForImages(input);
      await waitForFonts();

      if (typeof window !== "undefined" && !window.html2canvas) {
        window.html2canvas = html2canvas;
      }

      await downloadElementAsPdf(
        input,
        `appointment_${appt.appointmentId || appt._id || "details"}.pdf`
      );
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert(`Failed to generate PDF. ${error?.message || ""}`);
    } finally {
      if (scroller) {
        scroller.style.overflow = prevOverflow || "";
        scroller.style.maxHeight = prevMaxH || "";
      }
      setIsGeneratingPdf(false);
    }
  };

  // Auto-trigger download once opened if requested (NOW also depends on appt id)
  React.useEffect(() => {
    if (open && autoDownload) {
      const t = setTimeout(() => {
        handleDownloadPdf();
      }, 250);
      return () => clearTimeout(t);
    }
  }, [open, autoDownload, appt?._id]); // <- UPDATED

  // Inline HEX styles to avoid OKLCH usage
  const COLORS = {
    green50: "#f0fdf4",
    green100: "#dcfce7",
    green200: "#bbf7d0",
    green700: "#15803d",
    green800: "#166534",
    lime100: "#ecfccb",
    white70: "rgba(255,255,255,0.7)",
  };

  const statusStyle = (status) => {
    switch ((status || "").toLowerCase()) {
      case "confirmed":
        return { backgroundColor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" };
      case "pending":
        return { backgroundColor: "#fefce8", color: "#a16207", border: "1px solid #fde68a" };
      case "cancelled":
        return { backgroundColor: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" };
      case "completed":
        return { backgroundColor: "#f7fee7", color: "#3f6212", border: "1px solid #d9f99d" };
      default:
        return { backgroundColor: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb" };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border max-h-[90vh] overflow-hidden animate-slideUp"
        style={{ borderColor: COLORS.green100 }}
      >
        {/* Header */}
        <div
          className="relative px-8 py-6"
          style={{
            background: "linear-gradient(to right, #bbf7d0, #dcfce7, #ecfccb)",
            color: "#14532d",
          }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(255,255,255,0.10)" }} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div
                className="p-3 rounded-2xl backdrop-blur-sm border"
                style={{ backgroundColor: COLORS.white70, borderColor: "#ffffff" }}
              >
                <svg className="w-8 h-8" style={{ color: "#047857" }} fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: "#166534" }}>
                  Agricultural Appointment
                </div>
                <div className="text-2xl font-bold drop-shadow-sm" style={{ color: "#14532d" }}>
                  {apptNo}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {onEdit && (
                <button
                  onClick={() => onEdit(appt)}
                  className="px-4 py-2 rounded-xl shadow-sm border transition-all duration-300 hover:scale-[1.02]"
                  style={{ backgroundColor: COLORS.white70, color: "#14532d", borderColor: "#ffffff" }}
                >
                  Edit
                </button>
              )}
              {onCancel && canCancel && (
                <button
                  onClick={() => onCancel(appt)}
                  className="px-4 py-2 rounded-xl shadow-sm border transition-all duration-300 hover:scale-[1.02]"
                  style={{ backgroundColor: COLORS.white70, color: "#14532d", borderColor: "#ffffff" }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="group px-6 py-3 rounded-xl shadow-sm border transition-all duration-300 flex items-center gap-2 font-medium hover:scale-[1.02]"
                style={{
                  backgroundColor: isGeneratingPdf ? "#e5e7eb" : COLORS.white70,
                  color: "#14532d",
                  borderColor: "#ffffff",
                  cursor: isGeneratingPdf ? "not-allowed" : "pointer",
                }}
              >
                {isGeneratingPdf ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" style={{ color: "#047857" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-3 rounded-xl shadow-sm border transition-all duration-300 hover:scale-[1.02]"
                style={{ backgroundColor: COLORS.white70, color: "#14532d", borderColor: "#ffffff" }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable content wrapper */}
        <div
          ref={scrollRef}
          className="overflow-y-auto max-h-[calc(90vh-120px)]"
          style={{ backgroundColor: COLORS.green50 }}
        >
          {/* Everything inside here is captured */}
          <div ref={printRef} className="px-8 py-8 space-y-8">
            {/* Booking Details */}
            <Card title="Booking Details" icon={<CalendarHeaderIcon />} colors={COLORS}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoCard icon={<UserIcon />} label="Client Name" value={appt.name} colors={COLORS} />
                <InfoCard icon={<CategoryIcon />} label="Service Category" value={appt.category} colors={COLORS} />
                <InfoCard icon={<CalendarIcon />} label="Appointment Date" value={dateStr} colors={COLORS} />
                <InfoCard icon={<ClockIcon />} label="Time Slot" value={appt.appointmentTime} colors={COLORS} />
                <InfoCard icon={<ClockIcon />} label="Duration" value={`${appt.durationHours} hour(s)`} colors={COLORS} />
                <div className="flex flex-col">
                  <div className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: COLORS.green700 }}>
                    <StatusIcon />
                    Current Status
                  </div>
                  <span
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold"
                    style={statusStyle(appt.status || "pending")}
                  >
                    {(appt.status || "pending").toUpperCase()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Service Location */}
            <Card title="Service Location" icon={<PinHeaderIcon />} colors={COLORS}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoCard icon={<LocationIcon />} label="Province" value={appt.state} colors={COLORS} />
                <InfoCard icon={<CityIcon />} label="District/City" value={appt.city} colors={COLORS} />
                <InfoCard icon={<AddressIcon />} label="Full Address" value={appt.address || "Address not specified"} colors={COLORS} />
              </div>
            </Card>

            {/* Contact */}
            <Card title="Contact Information" icon={<MailHeaderIcon />} colors={COLORS}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard icon={<EmailIcon />} label="Email Address" value={appt.email} colors={COLORS} />
                <InfoCard icon={<PhoneIcon />} label="Phone Number" value={appt.phone} colors={COLORS} />
              </div>
            </Card>

            {/* Consultant */}
            {(appt.consultantName || consultant) && (
              <Card title="Agricultural Expert" icon={<PersonHeaderIcon />} colors={COLORS}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
                  <InfoCard icon={<UserIcon />} label="Expert Name" value={appt.consultantName || consultant?.name} colors={COLORS} />
                  <InfoCard icon={<CityIcon />} label="Based In" value={consultant?.city || "Not specified"} colors={COLORS} />
                  <InfoCard icon={<CategoryIcon />} label="Specialization" value={consultant?.category || appt.category} colors={COLORS} />
                  <InfoCard
                    icon={<ExperienceIcon />}
                    label="Experience"
                    value={consultant?.yearsExp ? `${consultant.yearsExp} years` : "Not specified"}
                    colors={COLORS}
                  />
                </div>
                {consultant?.about && (
                  <div className="mt-4 p-5 rounded-xl border"
                       style={{ backgroundColor: COLORS.green50, borderColor: COLORS.green100 }}>
                    <h4 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: COLORS.green700 }}>
                      <InfoSmallIcon />
                      About the Expert
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: COLORS.green700 }}>{consultant.about}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Notes */}
            {appt.notes && (
              <Card title="Special Instructions & Notes" icon={<DocHeaderIcon />} colors={COLORS}>
                <div className="p-5 rounded-xl border"
                     style={{ backgroundColor: COLORS.green50, borderColor: COLORS.green100 }}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium" style={{ color: COLORS.green700 }}>
                    {appt.notes}
                  </p>
                </div>
              </Card>
            )}

            {/* Footer */}
            <div
              className="rounded-2xl p-6 border text-center"
              style={{ background: "linear-gradient(to right, #dcfce7, #ecfccb)", borderColor: COLORS.green100 }}
            >
              <div className="flex items-center justify-center gap-2" style={{ color: COLORS.green700 }}>
                <LeafIcon />
                <span className="text-sm font-semibold">
                  Growing Together Through Expert Agricultural Consultation
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------- Small building blocks ----------------- */

function Card({ title, icon, children, colors }) {
  return (
    <div
      className="bg-white rounded-2xl p-6 border shadow-md hover:shadow-lg transition-shadow duration-300"
      style={{ borderColor: colors.green100 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl shadow-sm" style={{ backgroundColor: colors.green200 }}>
          {icon}
        </div>
        <h3 className="text-xl font-bold" style={{ color: colors.green700 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoCard({ icon, label, value, colors }) {
  return (
    <div
      className="rounded-xl p-4 border hover:shadow-sm transition-all duration-300"
      style={{ backgroundColor: colors.green50, borderColor: colors.green100 }}
    >
      <div className="flex items-center gap-2 mb-2" style={{ color: colors.green700 }}>
        <div style={{ color: "#059669" }}>{icon}</div>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="text-base font-bold break-words" style={{ color: colors.green800 }}>
        {value || "Not provided"}
      </div>
    </div>
  );
}

/* ----------------- Helpers & Icons ----------------- */

// Ensure images inside the capture area are fully loaded before html2canvas runs
async function waitForImages(root) {
  if (!root) return;
  const imgs = Array.from(root.querySelectorAll("img"));
  if (!imgs.length) return;
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        const done = () => {
          img.removeEventListener("load", done);
          img.removeEventListener("error", done);
          resolve();
        };
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    })
  );
}

// Wait for web fonts to be ready (prevents blank text in canvas)
async function waitForFonts() {
  try {
    if (document?.fonts?.ready) await document.fonts.ready;
  } catch {}
}

const UserIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const CategoryIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15.586 13H17z" clipRule="evenodd" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

const StatusIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l-4-4z" clipRule="evenodd" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

const CityIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 2h2v2H7V6zm2 4H7v2h2v-2zm2-4h2v2h-2V6zm2 4h-2v2h2v-2z" clipRule="evenodd" />
  </svg>
);

const AddressIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
  </svg>
);

const ExperienceIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
  </svg>
);

const CalendarHeaderIcon = () => (
  <svg className="w-6 h-6" style={{ color: "#047857" }} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const PinHeaderIcon = () => (
  <svg className="w-6 h-6" style={{ color: "#047857" }} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

const MailHeaderIcon = () => (
  <svg className="w-6 h-6" style={{ color: "#047857" }} fill="currentColor" viewBox="0 0 20 20">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
  </svg>
);

const PersonHeaderIcon = () => (
  <svg className="w-6 h-6" style={{ color: "#047857" }} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const DocHeaderIcon = () => (
  <svg className="w-6 h-6" style={{ color: "#047857" }} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

const InfoSmallIcon = () => (
  <svg className="w-4 h-4" style={{ color: "#166534" }} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const LeafIcon = () => (
  <svg className="w-5 h-5" style={{ color: "#15803d" }} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
  </svg>
);
