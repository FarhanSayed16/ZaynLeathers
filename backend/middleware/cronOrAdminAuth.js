import adminAuth from "./adminAuth.js";

/** Allow cron callers with X-Cron-Secret, otherwise require admin JWT. */
export default function cronOrAdminAuth(req, res, next) {
  const secret = process.env.CRON_SECRET?.trim();
  const header = String(req.headers["x-cron-secret"] || "").trim();
  if (secret && header && header === secret) {
    req.cronAuth = true;
    return next();
  }
  return adminAuth(req, res, next);
}
