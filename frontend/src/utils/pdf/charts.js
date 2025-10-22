// Chart renderer for PDF (legends hidden)

let _chartReadyPromise = null;

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

export function ensureChartJs() {
  if (_chartReadyPromise) return _chartReadyPromise;
  _chartReadyPromise = (async () => {
    if (!window.Chart) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js");
    }
    if (!window.Chart) throw new Error("Chart.js failed to load");
  })();
  return _chartReadyPromise;
}

export async function renderChartToDataURL({ type, labels, data, title }) {
  await ensureChartJs();

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = type === "bar" ? 520 : 460;
  const ctx = canvas.getContext("2d");

  // emerald palette
  const fills = [
    "rgba(4,120,87,0.85)",
    "rgba(16,185,129,0.85)",
    "rgba(52,211,153,0.85)",
    "rgba(110,231,183,0.85)",
  ];
  const borders = [
    "rgb(4,120,87)",
    "rgb(16,185,129)",
    "rgb(52,211,153)",
    "rgb(110,231,183)",
  ];

  const dataset = {
    label: title,
    data,
    backgroundColor: (type === "doughnut" || type === "pie") ? fills : "rgb(4,120,87)",
    borderColor:   (type === "doughnut" || type === "pie") ? borders : "rgb(16,185,129)",
    borderWidth: 2,
    tension: type === "line" ? 0.4 : 0,
    fill: false,
  };

  // eslint-disable-next-line no-undef
  const chart = new Chart(ctx, {
    type,
    data: { labels, datasets: [dataset] },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },              // ← hide legends
        title:  { display: true, text: title },  // keep titles
        tooltip: { enabled: true },
      },
      scales: (type === "bar" || type === "line")
        ? {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { precision: 0 } },
          }
        : {},
      layout: {
        padding: { top: 10, bottom: 10, left: 10, right: 10 },
      },
    },
  });

  await new Promise((r) => setTimeout(r, 30));
  const url = canvas.toDataURL("image/png", 1.0);
  chart.destroy();
  return url;
}
