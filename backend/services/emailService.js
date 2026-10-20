const nodemailer = require('nodemailer');

const OTP_EXPIRY_MINUTES = 10;

/**
 * Creates and returns a configured nodemailer transporter.
 * Throws if any required SMTP environment variable is missing.
 */
const createTransporter = () => {
  const requiredSettings = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingSetting = requiredSettings.find(setting => !process.env[setting]);
  if (missingSetting) {
    throw new Error(`Email service is not configured: missing ${missingSetting}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Sends a branded OTP email to the user.
 * @param {Object} user  - Mongoose user document (must have .email and .name)
 * @param {string} otp   - The plain-text 6-digit OTP to send
 */
const sendPasswordResetOtp = async (user, otp) => {
  const otpDigits = otp
    .split('')
    .map(
      d => `
      <td style="width:44px;height:52px;background:#f1f5ff;border:1px solid #dde4f8;
                 border-radius:8px;text-align:center;vertical-align:middle;
                 font-size:26px;font-weight:700;color:#2d3a8c;font-family:monospace;">
        ${d}
      </td>`,
    )
    .join('<td style="width:8px;"></td>');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(45,58,140,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2d3a8c 0%,#6c4fd4 100%);
                     padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">
              SRI-KO
            </h1>
            <p style="margin:4px 0 0;color:#c7d2fe;font-size:12px;
                      letter-spacing:2px;text-transform:uppercase;">
              Foreign Language Training Center
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#1e293b;">
              Hello, ${user.name || 'Scholar'} 👋
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:#475569;line-height:1.6;">
              We received a request to reset your SRI-KO account password.
              Use the verification code below — it is valid for
              <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
            </p>

            <!-- OTP Digits -->
            <table align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>${otpDigits}</tr>
            </table>

            <p style="margin:0 0 24px;font-size:13px;color:#64748b;text-align:center;">
              Enter this code on the verification page to continue.
            </p>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;">

            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;">
              🔒 If you did not request a password reset, please ignore this email —
              your account is safe.<br>
              ⚠️ Never share this code with anyone. SRI-KO staff will never ask for your OTP.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:18px 40px;text-align:center;
                     border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              © ${new Date().getFullYear()} SRI-KO Academic Institute. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await createTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: 'SRI-KO — Your Password Reset Code',
    text: `Your SRI-KO password reset code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.`,
    html,
  });
};

module.exports = { sendPasswordResetOtp };
