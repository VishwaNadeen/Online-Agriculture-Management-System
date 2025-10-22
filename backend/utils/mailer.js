// utils/mailer.js
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  APP_NAME = "GreenGrow",
  APP_SUPPORT_EMAIL = SMTP_USER,
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

export async function sendPasswordCodeEmail({ to, code }) {
  const subject = `${APP_NAME}: Your password reset code`;
  const text = [
    `We received a request to reset your ${APP_NAME} password.`,
    ``,
    `Your one-time code: ${code}`,
    ``,
    `This code will expire in 10 minutes.`,
    `If you didn't request this, you can ignore this email.`,
    ``,
    `— ${APP_NAME} Team`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6">
      <h2>${APP_NAME}: Password reset</h2>
      <p>We received a request to reset your ${APP_NAME} password.</p>
      <p><strong style="font-size:22px;letter-spacing:2px">${code}</strong></p>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p style="color:#666">— ${APP_NAME} • ${APP_SUPPORT_EMAIL || ""}</p>
    </div>
  `;

  await transporter.sendMail({
    from: `${APP_NAME} <${APP_SUPPORT_EMAIL || SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}
