import nodemailer from "nodemailer";

/**
 * Creates a transporter from env, or falls back to Ethereal in dev.
 */
async function makeTransporter() {
  const hasEnvSMTP =
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS;

  if (hasEnvSMTP) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    try {
      await transporter.verify();
      return transporter;
    } catch (e) {
      // silently fallback to Ethereal if verify fails
    }
  }

  // Dev fallback (no env): Ethereal
  const testAccount = await nodemailer.createTestAccount();
  const ethereal = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return ethereal;
}

let transporterPromise = makeTransporter();

export async function sendMail({ to, subject, html }) {
  try {
    const transporter = await transporterPromise;
    const from = process.env.MAIL_FROM || "GreenGrow <no-reply@greengrow.example>";
    const info = await transporter.sendMail({ from, to, subject, html });

    // Ethereal preview URL (optional, not logged)
    nodemailer.getTestMessageUrl(info);
    return info;
  } catch (err) {
    // silently fail instead of logging to terminal
    return null;
  }
}

const base = process.env.APP_BASE_URL || "http://localhost:5173";
const SITE_NAME = process.env.SITE_NAME || "GreenGrow";

export function apptLink(id) {
  return `${base}/my-appointments/${id}`; // or your exact route
}

export const EmailTpl = {
  created: (farmerName, dateStr, consultantEmail, id) => ({
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

  declined: (consultantName, dateStr, farmerEmail, reason, id) => ({
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
