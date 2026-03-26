import nodemailer from "nodemailer";

// Create Brevo SMTP transporter
const createTransporter = () => {
  console.log("📧 SMTP config:", {
    host: process.env.BREVO_SMTP_HOST,
    port: process.env.BREVO_SMTP_PORT,
    user: process.env.BREVO_SMTP_USER,
    passSet: !!process.env.BREVO_SMTP_PASS,
  });
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
    port: parseInt(process.env.BREVO_SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  });
};

// Welcome email template for new restaurant owners
const getWelcomeEmailHTML = ({ ownerName, restaurantName, email, password, plan }) => {
  const planDetails = {
    basic: { label: "Basic", tables: 10, staff: 5, price: "Free Trial" },
    professional: { label: "Professional", tables: 30, staff: 15, price: "₹2,999/mo" },
    enterprise: { label: "Enterprise", tables: "Unlimited", staff: "Unlimited", price: "₹7,999/mo" },
  };

  const planInfo = planDetails[plan] || planDetails.basic;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Khao Peeo</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:40px 32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;">🍽️ Khao Peeo</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Restaurant Management Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 8px;color:#111827;font-size:22px;">Welcome, ${ownerName}! 🎉</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Thank you for choosing <strong style="color:#f97316;">Khao Peeo</strong> to power your restaurant 
                <strong style="color:#111827;">${restaurantName}</strong>. Your account has been created and is ready to use!
              </p>

              <!-- Credentials Box -->
              <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:24px;margin-bottom:24px;">
                <h3 style="margin:0 0 16px;color:#ea580c;font-size:16px;font-weight:700;">🔐 Your Login Credentials</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #fed7aa;">
                      <span style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</span>
                      <br/>
                      <span style="color:#111827;font-size:15px;font-weight:600;">${email}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <span style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Password</span>
                      <br/>
                      <span style="color:#111827;font-size:15px;font-weight:600;font-family:monospace;background:#f3f4f6;padding:4px 8px;border-radius:6px;">${password}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Plan Box -->
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:24px;">
                <h3 style="margin:0 0 16px;color:#16a34a;font-size:16px;font-weight:700;">📦 Your Plan: ${planInfo.label}</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;color:#374151;font-size:14px;">✅ Up to <strong>${planInfo.tables} Tables</strong></td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#374151;font-size:14px;">✅ Up to <strong>${planInfo.staff} Staff Members</strong></td>
                  </tr>
                  ${plan !== "basic" ? `
                  <tr>
                    <td style="padding:6px 0;color:#374151;font-size:14px;">✅ <strong>Analytics Dashboard</strong></td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#374151;font-size:14px;">✅ <strong>Custom Branding</strong></td>
                  </tr>` : ""}
                  ${plan === "enterprise" ? `
                  <tr>
                    <td style="padding:6px 0;color:#374151;font-size:14px;">✅ <strong>Multi-Location Support</strong></td>
                  </tr>` : ""}
                  <tr>
                    <td style="padding:8px 0 0;color:#16a34a;font-size:14px;font-weight:700;">🎁 14-Day Free Trial Active!</td>
                  </tr>
                </table>
              </div>

              <!-- Security Notice -->
              <div style="background:#fff1f2;border-left:4px solid #f43f5e;padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
                <p style="margin:0;color:#be123c;font-size:13px;">
                  <strong>⚠️ Security Notice:</strong> Please change your password after your first login for better security.
                </p>
              </div>

              <!-- Support -->
              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
                Need help getting started? Contact us on WhatsApp at 
                <a href="https://wa.me/919152515229" style="color:#f97316;font-weight:600;text-decoration:none;">+91 9152515229</a>
                and we'll be happy to assist you!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © 2024 Khao Peeo. All rights reserved.<br/>
                This email was sent because a restaurant account was created for you on our platform.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Send welcome email to new restaurant owner
 */
export const sendWelcomeEmail = async ({ ownerName, restaurantName, email, password, plan }) => {
  try {
    if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
      console.warn("⚠️  Brevo SMTP credentials not configured. Skipping welcome email.");
      return { success: false, reason: "SMTP not configured" };
    }

    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || "Khao Peeo"}" <${process.env.BREVO_FROM_EMAIL || process.env.BREVO_SMTP_USER}>`,
      to: email,
      subject: `🎉 Welcome to Khao Peeo — Your Restaurant Account is Ready!`,
      html: getWelcomeEmailHTML({ ownerName, restaurantName, email, password, plan }),
    });

    console.log(`✅ Welcome email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send welcome email:", error.message);
    return { success: false, error: error.message };
  }
};
