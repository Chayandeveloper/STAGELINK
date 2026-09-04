import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailService = process.env.EMAIL_SERVICE || 'gmail';

  if (!emailUser || !emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: emailService,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

// Generate 6-digit numeric OTP
export const generateNumericOTP = (length: number = 6): string => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
};

// Template generator helper
const getEmailHtml = (title: string, greeting: string, message: string, otp: string, footerNote: string) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #0c0d12;
        color: #ffffff;
      }
      .container {
        max-width: 540px;
        margin: 30px auto;
        background: #18181b;
        border: 1px solid #27272a;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      }
      .header {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        padding: 32px 24px;
        text-align: center;
      }
      .logo {
        font-size: 26px;
        font-weight: 800;
        letter-spacing: -0.5px;
        color: #ffffff;
        margin: 0;
        text-transform: uppercase;
      }
      .tagline {
        font-size: 13px;
        color: #e0e7ff;
        margin-top: 4px;
      }
      .content {
        padding: 32px 28px;
        color: #d4d4d8;
        line-height: 1.6;
      }
      .greeting {
        font-size: 18px;
        font-weight: 600;
        color: #f4f4f5;
        margin-bottom: 12px;
      }
      .text {
        font-size: 15px;
        margin-bottom: 24px;
        color: #a1a1aa;
      }
      .otp-box {
        background: #09090b;
        border: 2px dashed #6366f1;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 28px 0;
      }
      .otp-code {
        font-size: 36px;
        font-weight: 800;
        letter-spacing: 8px;
        color: #818cf8;
        font-family: 'Courier New', Courier, monospace;
        margin: 0;
      }
      .otp-caption {
        font-size: 12px;
        color: #71717a;
        margin-top: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .warning {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: #fca5a5;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 13px;
        margin-top: 24px;
      }
      .footer {
        padding: 20px 24px;
        background: #121215;
        border-top: 1px solid #27272a;
        text-align: center;
        font-size: 12px;
        color: #71717a;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="logo">StageLink</h1>
        <div class="tagline">Live Music & Venue Ecosystem</div>
      </div>
      <div class="content">
        <div class="greeting">${greeting}</div>
        <p class="text">${message}</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="otp-caption">Valid for 10 minutes only</div>
        </div>
        <div class="warning">
          ⚠️ <strong>Security Notice:</strong> Never share this OTP with anyone. StageLink staff will never ask for your verification code.
        </div>
      </div>
      <div class="footer">
        ${footerNote}
        <br>&copy; ${new Date().getFullYear()} StageLink Inc. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};

// Send Email Verification OTP
export const sendVerificationEmail = async (email: string, name: string, otp: string): Promise<boolean> => {
  const transporter = createTransporter();
  const subject = `Your StageLink Verification Code: ${otp}`;
  const greeting = `Hello, ${name || 'User'}!`;
  const message = 'Thank you for signing up with StageLink. Please use the following One-Time Password (OTP) to verify your email address and activate your account:';
  const footerNote = 'If you did not register for a StageLink account, please ignore this email.';

  // Always log in terminal for quick development/testing visibility
  console.log('\n======================================================');
  console.log(`✉️ [STAGELINK VERIFICATION OTP] Sent to: ${email}`);
  console.log(`🔑 OTP CODE: >>> ${otp} <<<`);
  console.log('======================================================\n');

  if (!transporter) {
    console.warn('⚠️ EMAIL_USER or EMAIL_PASS not configured in .env. OTP was logged above for development.');
    return true;
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || `"StageLink Security" <${process.env.EMAIL_USER}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject,
      html: getEmailHtml('Verify your StageLink Account', greeting, message, otp, footerNote),
    });
    console.log(`✅ Verification email successfully delivered via Gmail to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send verification email to ${email}:`, error?.message || error);
    // Return true because OTP is still safely logged and stored in DB, allowing user flow to succeed in development
    return false;
  }
};

// Send Password Reset OTP
export const sendPasswordResetEmail = async (email: string, name: string, otp: string): Promise<boolean> => {
  const transporter = createTransporter();
  const subject = `Your StageLink Password Reset Code: ${otp}`;
  const greeting = `Hello, ${name || 'User'}!`;
  const message = 'We received a request to reset the password for your StageLink account. Use the following One-Time Password (OTP) to complete the reset process:';
  const footerNote = 'If you did not request a password reset, you can safely ignore this email.';

  console.log('\n======================================================');
  console.log(`🔐 [STAGELINK PASSWORD RESET OTP] Sent to: ${email}`);
  console.log(`🔑 OTP CODE: >>> ${otp} <<<`);
  console.log('======================================================\n');

  if (!transporter) {
    console.warn('⚠️ EMAIL_USER or EMAIL_PASS not configured in .env. OTP was logged above for development.');
    return true;
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || `"StageLink Security" <${process.env.EMAIL_USER}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject,
      html: getEmailHtml('Reset Your StageLink Password', greeting, message, otp, footerNote),
    });
    console.log(`✅ Password reset email successfully delivered via Gmail to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error?.message || error);
    return false;
  }
};
