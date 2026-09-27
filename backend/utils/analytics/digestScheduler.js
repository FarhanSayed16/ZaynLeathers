import { isFeatureEnabled } from "../../config/features.js";
import { istTimeParts, istYmd } from "./dateRange.js";
import { resolveDigestConfig, sendAnalyticsDigest } from "./digest.js";

let lastSchedulerKey = "";

/**
 * In-process scheduler tick — call every ~60s from server.js.
 * Sends once per IST day at 08:00 when digest is enabled.
 */
export async function maybeSendDailyDigest() {
  if (!isFeatureEnabled("analyticsPro")) {
    return { skipped: "feature_off" };
  }

  const { hour, minute } = istTimeParts();
  if (hour !== 8 || minute !== 0) {
    return { skipped: "not_scheduled_time" };
  }

  const key = `${istYmd()}-${hour}:${minute}`;
  if (lastSchedulerKey === key) {
    return { skipped: "already_tick" };
  }
  lastSchedulerKey = key;

  const config = await resolveDigestConfig();
  if (!config.enabled) return { skipped: "disabled" };
  if (!config.email) return { skipped: "no_email" };

  if (config.lastSentAt) {
    const lastIst = istYmd(new Date(config.lastSentAt));
    if (lastIst === istYmd()) {
      return { skipped: "already_sent_today" };
    }
  }

  return sendAnalyticsDigest({ force: false });
}
