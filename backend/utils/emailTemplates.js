const base = process.env.APP_BASE_URL || "http://localhost:5173";
const SITE_NAME = process.env.SITE_NAME || "GreenGrow";

export function apptLink(id) {
  return `${base}/my-appointments/${id}`; // or your exact route
}

export const EmailTpl = {
  created:   (farmerName, dateStr, consultantEmail, id) => ({
    to: consultantEmail,
    subject: `[${SITE_NAME}] New Appointment Request — ${dateStr}`,
    html: `
      <h2>New appointment request</h2>
      <p>${farmerName} requested an appointment on <b>${dateStr}</b>.</p>
      <p><a href="${apptLink(id)}">Open appointment</a></p>
    `,
  }),
  confirmed: (consultantName, dateStr, farmerEmail, id) => ({
    to: farmerEmail,
    subject: `[${SITE_NAME}] Appointment Confirmed — ${dateStr}`,
    html: `
      <h2>Confirmed</h2>
      <p>${consultantName} confirmed your appointment for <b>${dateStr}</b>.</p>
      <p><a href="${apptLink(id)}">View details</a></p>
    `,
  }),
  declined:  (consultantName, dateStr, farmerEmail, reason, id) => ({
    to: farmerEmail,
    subject: `[${SITE_NAME}] Appointment Declined — ${dateStr}`,
    html: `
      <h2>Declined</h2>
      <p>${consultantName} declined your appointment for <b>${dateStr}</b>.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ""}
      <p><a href="${base}/consultant">Find another consultant</a> or <a href="${apptLink(id)}">view request</a>.</p>
    `,
  }),
  cancelled: (farmerName, dateStr, consultantEmail, id) => ({
    to: consultantEmail,
    subject: `[${SITE_NAME}] Appointment Cancelled — ${dateStr}`,
    html: `
      <h2>Cancelled</h2>
      <p>${farmerName} cancelled the appointment scheduled for <b>${dateStr}</b>.</p>
      <p><a href="${apptLink(id)}">Open appointment</a></p>
    `,
  }),
};
