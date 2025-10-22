// utils/mailer.js
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  APP_NAME = "GreenGrow",
  APP_SUPPORT_EMAIL = SMTP_USER,
} = process.env;

// Create transporter with fallback to test account if SMTP not configured
let transporter;

async function createTransporter() {
  // If SMTP is configured, use it
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const smtpTransporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
        auth: { 
          user: SMTP_USER, 
          pass: SMTP_PASS 
        },
      });
      
      // Verify connection
      await smtpTransporter.verify();
      console.log("SMTP connection verified successfully");
      return smtpTransporter;
    } catch (error) {
      console.warn("SMTP configuration failed, falling back to test account:", error.message);
    }
  }
  
  // Fallback to Ethereal test account
  try {
    const testAccount = await nodemailer.createTestAccount();
    const etherealTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Using Ethereal test account for email");
    return etherealTransporter;
  } catch (error) {
    console.error("Failed to create email transporter:", error);
    throw new Error("Email service unavailable");
  }
}

// Initialize transporter
transporter = createTransporter();

export async function sendPasswordCodeEmail({ to, code }) {
  try {
    console.log(`Attempting to send password reset email to: ${to}`);
    const emailTransporter = await transporter;
    
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

    const info = await emailTransporter.sendMail({
      from: `${APP_NAME} <${APP_SUPPORT_EMAIL || SMTP_USER || "noreply@greengrow.com"}>`,
      to,
      subject,
      text,
      html,
    });

    // Log preview URL for Ethereal (development)
    if (info.messageId && info.messageId.includes('ethereal')) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("Email sent! Preview URL:", previewUrl);
    } else {
      console.log("Email sent successfully to:", to);
    }
    
    return info;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("Failed to send email");
  }
}