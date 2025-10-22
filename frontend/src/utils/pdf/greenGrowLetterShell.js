// Modern agriculture-themed PDF shell with fresh header + footer design (emoji-free)

let _pdfStackReadyPromise = null;

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
    document.head.appendChild(s);
  });
}

export function ensurePdfStackReady() {
  if (_pdfStackReadyPromise) return _pdfStackReadyPromise;
  _pdfStackReadyPromise = (async () => {
    if (!window.jspdf?.jsPDF) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    }
    if (!window.jspdf?.jsPDF) throw new Error("jsPDF failed to load");

    if (!window.jspdf?.jsPDF?.API?.autoTable) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
    }
    if (!window.jspdf?.jsPDF?.API?.autoTable) throw new Error("autoTable failed to load");
  })();
  return _pdfStackReadyPromise;
}

/**
 * Small vector leaf mark (replaces emoji while keeping style).
 * Draws two overlapping ellipses + a stem line.
 */
function drawLeaf(doc, x, y, scale = 1, color = [4, 120, 87]) {
  const [r, g, b] = color;
  doc.setFillColor(r, g, b);
  doc.setDrawColor(r, g, b);

  // left leaf
  doc.ellipse(x, y, 1.5 * scale, 1.0 * scale, "F");
  // right leaf
  doc.ellipse(x + 1.6 * scale, y, 1.5 * scale, 1.0 * scale, "F");
  // stem
  doc.setLineWidth(0.5 * scale);
  doc.line(x + 0.8 * scale, y + 0.9 * scale, x + 0.8 * scale, y + 2.8 * scale);
}

/**
 * Create modern agriculture-themed header/footer with fresh design (no emojis).
 */
export async function createGreenGrowLetterShell(options = {}) {
  await ensurePdfStackReady();
  const { jsPDF } = window.jspdf;

  const {
    brandName = "Green Grow",
    brandAccent = [4, 120, 87],   // emerald-700
    brandPrimary = [17, 24, 39],  // gray-900
    addressLines = ["123 Harvest Lane, Colombo, Sri Lanka"],
    contactLine = "Contact: +94 11 234 5678",
    emailLine = "Email: support@greengrow.lk",
    rightTitle = "USERS REPORT",
    rightSubTitle = new Date().toLocaleString(),
    footerNoteLeft = "This is a computer-generated report.",
    footerNoteRight = "greengrow.lk | +94 11 234 5678",
  } = options;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const margins = { top: 38, right: 18, bottom: 20, left: 18 };
  const contentWidth = pageW - margins.left - margins.right;

  // ===== HEADER (modern layered bands) =====
  const drawHeader = () => {
    // soft layered header bands
    doc.setFillColor(240, 253, 244); // green-50
    doc.rect(0, 0, pageW, 28, "F");
    doc.setFillColor(220, 252, 231); // green-100
    doc.rect(0, 0, pageW, 14, "F");

    // Decorative accent bar
    doc.setFillColor(...brandAccent);
    doc.rect(0, 28, pageW, 2, "F");

    // Brand mark (vector leaf) and brand name
    drawLeaf(doc, margins.left - 1.5, 10, 1.1, brandAccent);

    doc.setTextColor(...brandPrimary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(brandName, margins.left + 6, 12);

    // Company info
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99); // gray-600

    let y = 20;
    addressLines.forEach((line) => {
      if (line) doc.text(String(line), margins.left + 6, y);
      y += 3.5;
    });

    // Contact lines (emoji-free)
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFontSize(7.5);
    if (contactLine) { doc.text("Tel: " + String(contactLine).replace(/^Contact:\s*/i, ""), margins.left + 6, y); y += 3.2; }
    if (emailLine)   { doc.text("Email: " + String(emailLine).replace(/^Email:\s*/i, ""),   margins.left + 6, y); }

    // Right side "card"
    const boxWidth = 65;
    const boxX = pageW - margins.right - boxWidth;
    const boxY = 6;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(209, 213, 219); // gray-300
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, boxY, boxWidth, 18, 2, 2, "FD");

    doc.setTextColor(...brandAccent);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(String(rightTitle).toUpperCase(), boxX + boxWidth / 2, boxY + 6, { align: "center" });

    doc.setTextColor(107, 114, 128); // gray-500
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(String(rightSubTitle), boxX + boxWidth / 2, boxY + 12, { align: "center" });

    // Decorative corner dot
    doc.setFillColor(...brandAccent);
    doc.circle(boxX + boxWidth - 2, boxY + 2, 1.5, "F");

    // baseline under header content
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.line(margins.left, 30, pageW - margins.right, 30);
  };

  // ===== FOOTER (same style, safer positioning) =====
  const drawFooter = () => {
    // nudge footer a bit higher so nothing clips at the bottom
    const yBase = pageH - margins.bottom - 6;

    // double line (accent + hairline)
    doc.setDrawColor(...brandAccent);
    doc.setLineWidth(0.5);
    doc.line(margins.left, yBase, pageW - margins.right, yBase);

    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.2);
    doc.line(margins.left, yBase + 0.5, pageW - margins.right, yBase + 0.5);

    // footer strip filling to the bottom
    const stripY = yBase + 1;
    const stripH = pageH - stripY;
    doc.setFillColor(249, 250, 251); // gray-50
    doc.rect(0, stripY, pageW, stripH, "F");

    // text lines
    const textY = yBase + 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    // left note
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(String(footerNoteLeft), margins.left, textY);

    // center page number
    const center = pageW / 2;
    const pageText = `Page ${doc.getCurrentPageInfo().pageNumber} of ${doc.getNumberOfPages()}`;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandAccent);
    doc.text(pageText, center, textY, { align: "center" });

    // right note
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(String(footerNoteRight), pageW - margins.right, textY, { align: "right" });

    // tiny decorative leaves (vector) — keep inside margins
    const leafY = textY + 1.2;
    drawLeaf(doc, margins.left + 1.5, leafY, 0.6, brandAccent);
    drawLeaf(doc, pageW - margins.right - 1.5, leafY, 0.6, brandAccent);
  };

  drawHeader();
  drawFooter();

  const addPage = () => {
    doc.addPage();
    drawHeader();
    drawFooter();
  };

  const save = (filename) => doc.save(filename || "report.pdf");

  return { doc, margins, contentWidth, addPage, save };
}
