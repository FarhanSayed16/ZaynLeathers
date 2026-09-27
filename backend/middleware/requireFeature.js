import { isFeatureEnabled } from "../config/features.js";

export function requireFeature(name) {
  return (req, res, next) => {
    if (!isFeatureEnabled(name)) {
      return res.status(403).json({
        success: false,
        enabled: false,
        message: `Feature "${name}" is not enabled on this deployment`,
      });
    }
    next();
  };
}
