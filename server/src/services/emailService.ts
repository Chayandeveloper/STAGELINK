import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let cachedTransporter: any = null;

// Create or return pooled transporter
const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const emailUser = process.env.EMAIL_USER?.trim();
  const rawPass = process.env.EMAIL_PASS?.trim();
  const emailService = process.env.EMAIL_SERVICE || 'gmail';

  if (!emailUser || !rawPass) {
    return null;
  }

  // Remove any spaces that Google App Passwords often contain (e.g. "xxxx xxxx xxxx xxxx")
  const cleanPass = rawPass.replace(/\s+/g, '');

  cachedTransporter = nodemailer.createTransport({
    service: emailService,
    pool: true, // Keep connection alive for fast subsequent sends
    maxConnections: 3,
    maxMessages: 100,
    auth: {
      user: emailUser,
      pass: cleanPass,
    },
  });

  return cachedTransporter;
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

// Helper to send email via HTTP API (EmailJS, Resend, or Brevo) - Bypasses Render free tier SMTP blocks
const sendViaHttpApi = async (to: string, subject: string, html: string, otp?: string, name?: string): Promise<boolean> => {
  // 1. EmailJS (Direct personal Gmail sending via Port 443 - Never blocked on Render!)
  const emailjsServiceId = process.env.EMAILJS_SERVICE_ID?.trim() || 'service_8a6owk3';
  const emailjsTemplateId = process.env.EMAILJS_TEMPLATE_ID?.trim() || 'template_uwj47my';
  const emailjsPublicKey = process.env.EMAILJS_PUBLIC_KEY?.trim() || 'dikNrV2u5CVOaxlkA';
  const emailjsPrivateKey = process.env.EMAILJS_PRIVATE_KEY?.trim() || 'mLum3gzmD9JQLAZbvrCe6';

  if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: emailjsServiceId,
          template_id: emailjsTemplateId,
          user_id: emailjsPublicKey,
          accessToken: emailjsPrivateKey,
          template_params: {
            email: to,
            to_email: to,
            passcode: otp || '',
            otp: otp || '',
            to_name: name || 'User',
            name: name || 'User',
            time: '10 minutes',
          },
        }),
      });

      const resText = await response.text();
      if (response.ok || resText === 'OK') {
        console.log(`✅ Email successfully delivered via EmailJS to ${to}`);
        return true;
      } else {
        console.error(`❌ EmailJS API response [${response.status}]:`, resText);
        if (resText.includes('non-browser')) {
          console.error('👉 Enable "Allow EmailJS API for non-browser applications" at https://dashboard.emailjs.com/admin/account/security');
        }
      }
    } catch (e: any) {
      console.error('❌ EmailJS HTTP request failed:', e.message || e);
    }
  }

  // 2. Resend API (resend.com - Free 3,000 emails/mo)
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    try {
      const from = process.env.EMAIL_FROM || 'StageLink <onboarding@resend.dev>';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
        }),
      });
      const data: any = await response.json();
      if (response.ok) {
        console.log(`✅ Email successfully delivered via Resend HTTPS API to ${to} (ID: ${data.id})`);
        return true;
      } else {
        console.error('❌ Resend API error:', data);
      }
    } catch (e: any) {
      console.error('❌ Resend HTTP request failed:', e.message || e);
    }
  }

  return false;
};

// Send Email Verification OTP
export const sendVerificationEmail = async (email: string, name: string, otp: string): Promise<boolean> => {
  const subject = `Your StageLink Verification Code: ${otp}`;
  const greeting = `Hello, ${name || 'User'}!`;
  const message = 'Thank you for signing up with StageLink. Please use the following One-Time Password (OTP) to verify your email address and activate your account:';
  const footerNote = 'If you did not register for a StageLink account, please ignore this email.';
  const html = getEmailHtml('Verify your StageLink Account', greeting, message, otp, footerNote);

  // Always log in terminal for quick development/testing visibility
  console.log('\n======================================================');
  console.log(`✉️ [STAGELINK VERIFICATION OTP] Sent to: ${email}`);
  console.log(`🔑 OTP CODE: >>> ${otp} <<<`);
  console.log('======================================================\n');

  // Try HTTP API first (EmailJS / Resend - works on Render free tier over Port 443)
  const httpSent = await sendViaHttpApi(email, subject, html, otp, name);
  if (httpSent) return true;

  const transporter = getTransporter();

  if (!transporter) {
    console.warn('⚠️ EMAIL_USER/EMAIL_PASS not configured in .env. OTP was logged above for development.');
    return true;
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || `"StageLink Security" <${process.env.EMAIL_USER}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject,
      html,
    });
    console.log(`✅ Verification email successfully delivered via Gmail SMTP to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send verification email to ${email}:`, error?.message || error);
    if (error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
      console.error('👉 NOTE: Render free tier blocks outbound SMTP ports 465/587. Add RESEND_API_KEY to send via HTTPS.');
    }
    return false;
  }
};

// Send Password Reset OTP
export const sendPasswordResetEmail = async (email: string, name: string, otp: string): Promise<boolean> => {
  const subject = `Your StageLink Password Reset Code: ${otp}`;
  const greeting = `Hello, ${name || 'User'}!`;
  const message = 'We received a request to reset the password for your StageLink account. Use the following One-Time Password (OTP) to complete the reset process:';
  const footerNote = 'If you did not request a password reset, you can safely ignore this email.';
  const html = getEmailHtml('Reset Your StageLink Password', greeting, message, otp, footerNote);

  console.log('\n======================================================');
  console.log(`🔐 [STAGELINK PASSWORD RESET OTP] Sent to: ${email}`);
  console.log(`🔑 OTP CODE: >>> ${otp} <<<`);
  console.log('======================================================\n');

  // Try HTTP API first (EmailJS / Resend - works on Render free tier over Port 443)
  const httpSent = await sendViaHttpApi(email, subject, html, otp, name);
  if (httpSent) return true;

  const transporter = getTransporter();

  if (!transporter) {
    console.warn('⚠️ EMAIL_USER/EMAIL_PASS not configured in .env. OTP was logged above for development.');
    return true;
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || `"StageLink Security" <${process.env.EMAIL_USER}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject,
      html,
    });
    console.log(`✅ Password reset email successfully delivered via Gmail SMTP to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error?.message || error);
    return false;
  }
};
