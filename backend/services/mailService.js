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
      console.log("[mail] SMTP transport ready:", process.env.SMTP_HOST);
      return transporter;
    } catch (e) {
      console.error("[mail] SMTP verify failed, falling back to Ethereal:", e.message);
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
  console.log("[mail] Using Ethereal test account:", testAccount.user);
  return ethereal;
}

let transporterPromise = makeTransporter();

export async function sendMail({ to, subject, html }) {
  try {
    const transporter = await transporterPromise;
    const from = process.env.MAIL_FROM || "GreenGrow <no-reply@greengrow.example>";
    const info = await transporter.sendMail({ from, to, subject, html });

    // Helpful logs (Ethereal gives a preview URL)
    const preview = nodemailer.getTestMessageUrl(info);
    console.log("[mail] Sent:", subject, "->", to, preview ? `\nPreview: ${preview}` : "");
    return info;
  } catch (err) {
    console.error("[mail] sendMail error:", err);
    // Don’t throw to the client; return null so controller can continue
    return null;
  }
}
