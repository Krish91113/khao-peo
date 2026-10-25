import nodemailer, { type Transporter } from "nodemailer";
import { ENV } from "../config/env.js";
import { createModuleLogger } from "../logging/logger.js";

const log = createModuleLogger("email");

export interface WelcomeEmailInput {
  ownerName: string;
  restaurantName: string;
  email: string;
  temporaryPassword: string;
  plan?: string;
}

export interface EmailResult {
  success: boolean;
  configured: boolean;
  messageId?: string;
  error?: string;
}

let transporter: Transporter | null = null;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function getTransporter(): Transporter | null {
  const smtpPassword = ENV.SMTP_APP_PASSWORD ?? ENV.SMTP_PASS;
  if (!ENV.SMTP_USER || !smtpPassword) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_SECURE,
      auth: { user: ENV.SMTP_USER, pass: smtpPassword },
    });
  }
  return transporter;
}

export function welcomeEmailTemplate(input: WelcomeEmailInput): { subject: string; html: string; text: string } {
  const ownerName = escapeHtml(input.ownerName);
  const restaurantName = escapeHtml(input.restaurantName);
  const email = escapeHtml(input.email);
  const password = escapeHtml(input.temporaryPassword);
  const loginUrl = escapeHtml(ENV.CLIENT_URL);
  return {
    subject: "Welcome to Khao Peeo POS — Your Restaurant Account Is Ready",
    html: `<!doctype html><html><body style="margin:0;background:#f6f7fb;font-family:Arial,sans-serif;color:#172033"><div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden"><header style="background:#ea580c;color:#fff;padding:28px;text-align:center"><h1 style="margin:0">Khao Peeo POS</h1><p>Restaurant management made simple</p></header><main style="padding:32px"><h2>Congratulations, ${ownerName}!</h2><p>Your restaurant account has been successfully created.</p><p><strong>Restaurant:</strong> ${restaurantName}</p><div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px"><p><strong>Login email:</strong> ${email}</p><p><strong>Temporary password:</strong> <code>${password}</code></p></div><p style="text-align:center;margin:28px 0"><a href="${loginUrl}" style="background:#ea580c;color:#fff;padding:13px 24px;border-radius:6px;text-decoration:none">Log in to Khao Peeo</a></p><p><strong>Security notice:</strong> Change this password immediately after your first login. Never share it with anyone.</p></main><footer style="padding:20px;text-align:center;color:#667085;font-size:12px">This message was sent because an account was created for your restaurant.</footer></div></body></html>`,
    text: `Welcome to Khao Peeo POS, ${input.ownerName}!\n\nYour restaurant account has been created.\nRestaurant: ${input.restaurantName}\nLogin email: ${input.email}\nTemporary password: ${input.temporaryPassword}\nLogin: ${ENV.CLIENT_URL}\n\nChange your password immediately after your first login. Never share this email.`,
  };
}

export async function sendWelcomeEmail(input: WelcomeEmailInput): Promise<EmailResult> {
  const mailer = getTransporter();
  if (!mailer) {
    log.warn("Email service disabled: SMTP_USER and SMTP password are not configured");
    return { success: false, configured: false, error: "Email service is not configured" };
  }
  try {
    const template = welcomeEmailTemplate(input);
    const info = await mailer.sendMail({
      from: ENV.MAIL_FROM || `${ENV.MAIL_FROM_NAME} <${ENV.SMTP_USER}>`, 
      to: input.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    log.info({ recipient: input.email, message_id: info.messageId }, "Welcome email sent");
    return { success: true, configured: true, messageId: info.messageId };
  } catch (error) {
    log.error({ err: error, recipient: input.email }, "Welcome email delivery failed");
    return { success: false, configured: true, error: "Email delivery failed" };
  }
}
