import jwt from 'jsonwebtoken'

export function readAdminToken(req) {
  const headerToken = req.headers.token;
  if (headerToken) return headerToken;
  const auth = req.headers.authorization;
  if (auth && String(auth).startsWith("Bearer ")) return auth.slice(7).trim();
  return "";
}

const adminAuth = async (req, res, next) => {
  try {
    const token = readAdminToken(req);
    if (!token) {
      return res.json({ success: false, message: "Not Authorized..Login Again" });
    }

    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    if (token_decode.role !== "admin") {
      return res.json({ success: false, message: "Not Authorized..Login Again" });
    }
    req.isAdmin = true;
    next();
  } catch (error) {
    return res.json({ success: false, message: "Not Authorized..Login Again" });
  }
};

export default adminAuth