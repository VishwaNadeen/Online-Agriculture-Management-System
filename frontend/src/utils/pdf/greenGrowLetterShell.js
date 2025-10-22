// src/utils/pdf/greenGrowLetterShell.js
// Minimal, reusable header+footer shell for Green Grow official letters.
// You add your own content separately using the returned margins/utilities.

const BRAND = {
  NAME: "Green Grow",
  COLOR: { r: 4, g: 120, b: 87 },      // emerald-700
  TINT:  { r: 209, g: 250, b: 229 },   // emerald-100
  ADDRESS_LINES: ["Green Grow", "Colombo 1, Sri Lanka", "0112425451"],
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some(s => (s.src || "").includes(src))) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

async function ensureJsPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  }
  if (!window.jspdf?.jsPDF) throw new Error("jsPDF failed to load");
  return window.jspdf.jsPDF;
}

/**
 * Create a blank A4 doc with Green Grow header & footer drawn.
 * Returns helpers so you can write body content without worrying about margins.
 *
 * @param {Object} [opts]
 * @param {number} [opts.left=18]     Left margin (mm)
 * @param {number} [opts.right=18]    Right margin (mm)
 * @param {string} [opts.logoDataUrl] Optional base64 PNG/SVG to place in the header
 * @returns {Promise<{
 *   doc:any,
 *   page:{ width:number, height:number },
 *   margins:{ left:number, right:number, top:number, bottom:number },
 *   contentWidth:number,
 *   contentHeight:number,
 *   addPage:()=>void,
 *   save:(fileName?:string)=>void,
 * }>}
 */
export async function createGreenGrowLetterShell(opts = {}) {
  const { left = 18, right = 18, logoDataUrl } = opts;

  const jsPDF = await ensureJsPDF();
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // Layout constants
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const headerH = 20;
  const footerH = 16;

  // Draw header/footer for current page
  const drawShell = () => {
    // Header band
    doc.setFillColor(BRAND.COLOR.r, BRAND.COLOR.g, BRAND.COLOR.b);
    doc.rect(0, 0, pageW, headerH, "F");

    // Optional logo
    if (logoDataUrl) {
      try { doc.addImage(logoDataUrl, "PNG", left, 3, 14, 14); } catch {}
    }

    // Brand name
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const nameX = logoDataUrl ? left + 18 : left;
    doc.text(BRAND.NAME, nameX, 12);

    // Address (right aligned)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    BRAND.ADDRESS_LINES.forEach((line, i) => {
      doc.text(line, pageW - right, 7 + i * 4, { align: "right" });
    });

    // Footer strip
    doc.setFillColor(BRAND.TINT.r, BRAND.TINT.g, BRAND.TINT.b);
    doc.rect(0, pageH - footerH, pageW, footerH, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30);
    doc.text(BRAND.ADDRESS_LINES.join(" • "), pageW / 2, pageH - 6, { align: "center" });
    doc.setTextColor(0, 0, 0);
  };

  // Initial draw
  drawShell();

  // Suggested content margins (below header, above footer)
  const top = headerH + 12;       // space under header
  const bottom = footerH + 10;    // space above footer
  const contentWidth = pageW - left - right;
  const contentHeight = pageH - top - bottom;

  // Add a new page that already has header/footer
  const addPage = () => {
    doc.addPage();
    drawShell();
  };

  // Save helper with a sensible default filename
  const save = (fileName) => {
    const dt = new Date();
    const ts = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}_${String(dt.getHours()).padStart(2,"0")}${String(dt.getMinutes()).padStart(2,"0")}`;
    const out = fileName || `Green_Grow_Letter_${ts}.pdf`;
    doc.save(out);
  };

  return {
    doc,
    page: { width: pageW, height: pageH },
    margins: { left, right, top, bottom },
    contentWidth,
    contentHeight,
    addPage,
    save,
  };
}
