// src/utils/pdf.js
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Capture a DOM node as a multipage A4 PDF.
 * - Builds an offscreen "sandbox" clone so we don't mutate your live UI.
 * - Injects local CSS that disables gradients, pseudo-elements, animations, etc.
 * - Sanitizes each element's computed styles to RGB/solid colors (no OKLCH).
 *
 * @param {HTMLElement} element - The root node to capture
 * @param {string} filename - Output file name
 * @param {{stripImages?: boolean, scale?: number}} opts
 */
export async function downloadElementAsPdf(
  element,
  filename = "document.pdf",
  opts = {}
) {
  if (!element) throw new Error("Missing element to export");
  const { stripImages = false, scale = 2 } = opts;

  // Ensure html2canvas is reachable (some libs expect it on window)
  if (typeof window !== "undefined" && !window.html2canvas) {
    window.html2canvas = html2canvas;
  }

  // --- Build an offscreen sandbox wrapper -------------------------------
  const sandbox = document.createElement("div");
  sandbox.className = "pdf-sandbox";
  sandbox.style.position = "absolute";
  sandbox.style.left = "-10000px";
  sandbox.style.top = "0";
  sandbox.style.zIndex = "-1";
  sandbox.style.background = "#fff";

  // Keep width similar to source so line wraps match reasonably
  const rect = element.getBoundingClientRect();
  const targetWidth = Math.max(800, Math.round(rect.width)) || 1000;
  sandbox.style.width = `${targetWidth}px`;

  // A local stylesheet that neutralizes things html2canvas struggles with
  const styleTag = document.createElement("style");
  styleTag.textContent = `
    /* Only affects inside this sandbox */
    .pdf-sandbox, .pdf-sandbox * {
      /* prevent gradients that rely on OKLCH variables */
      background-image: none !important;
      animation: none !important;
      transition: none !important;
      filter: none !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      text-shadow: none !important;
    }
    /* Remove Tailwind v4 gradient utilities specifically */
    .pdf-sandbox [class*="bg-gradient-"] { background-image: none !important; }

    /* Pseudo elements can carry gradient backgrounds; hide them */
    .pdf-sandbox *::before, .pdf-sandbox *::after {
      content: none !important;
      background: transparent !important;
      background-image: none !important;
    }

    /* Optional: de-emphasize external images to avoid CORS taint */
    ${stripImages ? ".pdf-sandbox img { display: none !important; }" : ""}
  `;
  sandbox.appendChild(styleTag);

  // Clone the requested element and append to sandbox
  const clone = element.cloneNode(true);
  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  // --- Sanitize computed styles on the clone tree -----------------------
  const sanitizeEl = (el) => {
    // Resolve computed styles from the *sandboxed* element
    const cs = window.getComputedStyle(el);

    // Force solid background (computed value is rgb/rgba, not oklch)
    const bg = cs.backgroundColor;
    el.style.backgroundColor =
      bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" ? bg : "#ffffff";

    // Kill any remaining background images/gradients
    el.style.backgroundImage = "none";

    // Text and borders in resolved RGB
    el.style.color = cs.color;

    el.style.borderTopColor = cs.borderTopColor;
    el.style.borderRightColor = cs.borderRightColor;
    el.style.borderBottomColor = cs.borderBottomColor;
    el.style.borderLeftColor = cs.borderLeftColor;

    el.style.borderTopStyle = cs.borderTopStyle;
    el.style.borderRightStyle = cs.borderRightStyle;
    el.style.borderBottomStyle = cs.borderBottomStyle;
    el.style.borderLeftStyle = cs.borderLeftStyle;

    el.style.borderTopWidth = cs.borderTopWidth;
    el.style.borderRightWidth = cs.borderRightWidth;
    el.style.borderBottomWidth = cs.borderBottomWidth;
    el.style.borderLeftWidth = cs.borderLeftWidth;

    // Strip heavy/unsupported effects
    el.style.boxShadow = "none";
    el.style.filter = "none";
    el.style.backdropFilter = "none";
    el.style.textShadow = "none";

    // Recursively sanitize children
    for (const child of el.children) sanitizeEl(child);
  };
  sanitizeEl(clone);

  // Optionally scrub image CORS issues by inlining crossorigin attr on the clone
  if (!stripImages) {
    const imgs = clone.querySelectorAll("img");
    imgs.forEach((img) => {
      try {
        img.setAttribute("crossorigin", "anonymous");
        img.setAttribute("referrerpolicy", "no-referrer");
      } catch {}
    });
  }

  // --- Render & paginate ------------------------------------------------
  try {
    // Let layout settle before capture
    await new Promise((r) => setTimeout(r, 0));

    const canvas = await html2canvas(clone, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#FFFFFF",
      windowWidth: clone.scrollWidth || targetWidth,
      windowHeight: clone.scrollHeight || undefined,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 20;

    const imgW = pageW - margin * 2;
    const imgH = (canvas.height * imgW) / canvas.width;

    // First page
    let heightLeft = imgH;
    let y = margin;
    pdf.addImage(imgData, "PNG", margin, y, imgW, imgH, undefined, "FAST");
    heightLeft -= pageH - margin * 2;

    // Additional pages
    while (heightLeft > 0) {
      pdf.addPage();
      y = margin - (imgH - heightLeft);
      pdf.addImage(imgData, "PNG", margin, y, imgW, imgH, undefined, "FAST");
      heightLeft -= pageH - margin * 2;
    }

    pdf.save(filename);
  } finally {
    // Clean up sandbox
    if (sandbox.parentNode) sandbox.parentNode.removeChild(sandbox);
  }
}
