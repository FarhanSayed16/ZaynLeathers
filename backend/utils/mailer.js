import nodemailer from "nodemailer";
import { Resend } from "resend";
import brand from "../../shared/brand.config.js";

const FROM_NAME = brand.email?.fromName || brand.name || "Zayn Leathers";

function htmlToText(html = "") {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeRecipients(to) {
  const list = Array.isArray(to) ? to : [to];
  return list.map((item) => String(item || "").trim()).filter(Boolean);
}

function resolveProvider() {
  const explicit = String(process.env.MAIL_PROVIDER || "")
    .toLowerCase()
    .trim();
  if (explicit === "resend" || explicit === "smtp") return explicit;
  if (process.env.RESEND_API_KEY) return "resend";
  return "smtp";
}

function resolveFrom(provider) {
  const raw = process.env.EMAIL_FROM?.trim().replace(/^["']|["']$/g, "");
  if (raw) return raw;
  if (provider === "smtp" && process.env.SMTP_USER) {
    return `"${FROM_NAME}" <${process.env.SMTP_USER}>`;
  }
  throw new Error(
    "EMAIL_FROM is required for Resend. Example: Zayn Leathers <orders@afiyaleather.com>"
  );
}

function resolveReplyTo() {
  return (
    process.env.EMAIL_REPLY_TO?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    undefined
  );
}

function assertSmtpConfig() {
  const required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`SMTP not configured. Missing: ${missing.join(", ")}`);
  }
}

function createTransporter() {
  assertSmtpConfig();
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendWithSmtp({ from, to, subject, html, text, replyTo }) {
  const transporter = createTransporter();
  return transporter.sendMail({
    from,
    to: to.join(", "),
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
}

function isRetryableResendError(error) {
  const status = Number(error?.statusCode || error?.status || 0);
  return status === 429 || (status >= 500 && status < 600);
}

async function sendWithResend({ from, to, subject, html, text, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is missing");
  }

  const resend = new Resend(key);

  const attempt = async () => {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      const err = new Error(error.message || "Resend send failed");
      err.statusCode = error.statusCode;
      err.details = error;
      throw err;
    }

    return data;
  };

  try {
    return await attempt();
  } catch (error) {
    if (!isRetryableResendError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return attempt();
  }
}

/**
 * Send a generic email (OTP, orders, contact, etc.).
 * @param {string|string[]} to
 * @param {string} subject
 * @param {string} html
 */
export async function sendEmail({ to, subject, html }) {
  const recipients = normalizeRecipients(to);
  if (!recipients.length) throw new Error("No recipient specified");
  if (!subject) throw new Error("Email subject is required");

  const provider = resolveProvider();
  const from = resolveFrom(provider);
  const payload = {
    from,
    to: recipients,
    subject,
    html,
    text: htmlToText(html),
    replyTo: resolveReplyTo(),
  };

  if (provider === "resend") {
    const data = await sendWithResend(payload);
    console.log(
      `[MAIL] provider=resend id=${data?.id || "unknown"} recipients=${recipients.length}`
    );
    return data;
  }

  const info = await sendWithSmtp(payload);
  console.log(
    `[MAIL] provider=smtp id=${info.messageId || "unknown"} recipients=${recipients.length}`
  );
  return info;
}
