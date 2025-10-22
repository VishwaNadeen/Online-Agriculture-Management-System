// utils/mailer.js
import nodemailer from "nodemailer";

let transporter;
let isInitialized = false;

// create Ethereal test account automatically
export async function initMailer() {
  if (isInitialized && transporter) {
    return transporter;
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    // production or real email setup (e.g., Gmail)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log("📧 Using real SMTP account:", process.env.SMTP_USER);
  } else {
    // test mode (Ethereal)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  
  isInitialized = true;
  return transporter;
}

export async function sendPasswordCodeEmail({ to, code }) {
  try {
    if (!transporter) await initMailer();
    
    const info = await transporter.sendMail({
      from: `"GreenGrow Support" <no-reply@greengrow.com>`,
      to,
      subject: "GreenGrow Password Reset Code",
      text: `Your password reset code is ${code}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">GreenGrow Password Reset</h2>
          <p>You requested a password reset for your GreenGrow account.</p>
          <div style="background-color: #f0fdf4; border: 2px solid #059669; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h3 style="color: #059669; margin: 0; font-size: 32px; letter-spacing: 4px;">${code}</h3>
          </div>
          <p>Enter this code in the verification form to reset your password.</p>
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">GreenGrow Team</p>
        </div>
      `,
    });

    // show preview link if in test mode (Ethereal) - only show URL, no extra messages
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.log("Email preview:", preview);
    }
    
    return info;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}
