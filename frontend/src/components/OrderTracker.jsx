import { statusLabel, TRACKING_STAGES, trackingStageIndex } from "../utils/orderStatus";

/**
 * Shared live-status bar. Always uses TRACKING_STAGES so Woo status changes show correctly.
 */
const OrderTracker = ({ status }) => {
  const activeIndex = trackingStageIndex(status);

  return (
    <div className="mt-4">
      <div className="flex items-center">
        {TRACKING_STAGES.map((stage, index) => {
          const done = activeIndex >= 0 && index <= activeIndex;
          return (
            <div key={stage} className="flex items-center flex-1">
              <div
                className={`w-3 h-3 rounded-full border shrink-0 ${
                  done ? "bg-green-600 border-green-600" : "bg-white border-gray-300"
                }`}
              />
              {index < TRACKING_STAGES.length - 1 && (
                <div className={`flex-1 h-0.5 ${done ? "bg-green-600" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-tz-navy/45 mt-1">
        {TRACKING_STAGES.map((stage) => (
          <span key={stage} className="w-[20%] text-center">
            {statusLabel(stage)}
          </span>
        ))}
      </div>
    </div>
  );
};

export default OrderTracker;
