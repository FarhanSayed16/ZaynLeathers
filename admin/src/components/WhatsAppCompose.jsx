import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { isWhatsAppEnabled, useAdminFeatures } from "../context/AdminFeaturesContext";
import {
  ORDER_WA_TEMPLATES,
  buildCustomerWhatsAppText,
  buildOrderWhatsAppText,
  indiaWaDigits,
  openWhatsApp,
  phoneFromOrder,
  primaryItemStatus,
} from "../utils/whatsapp";

const WhatsAppCompose = ({
  order,
  user,
  phone: phoneProp,
  mode = "order",
  variant = "panel",
  onClose,
}) => {
  const { features, featuresLoading } = useAdminFeatures();

  const phone =
    phoneProp ||
    phoneFromOrder(order) ||
    user?.phone ||
    user?.addresses?.find((a) => a.isDefault)?.phone ||
    user?.addresses?.[0]?.phone ||
    "";

  const defaultTpl = useMemo(() => {
    if (mode !== "order" || !order) return "welcome";
    return primaryItemStatus(order);
  }, [mode, order]);

  const [templateId, setTemplateId] = useState(defaultTpl);
  const [text, setText] = useState("");

  useEffect(() => {
    setTemplateId(defaultTpl);
  }, [defaultTpl, order?._id, user?._id]);

  useEffect(() => {
    if (mode === "customer") {
      setText(buildCustomerWhatsAppText(user, order));
      return;
    }
    const id = ORDER_WA_TEMPLATES.some((t) => t.id === templateId) ? templateId : "summary";
    setText(buildOrderWhatsAppText(order, id));
  }, [mode, templateId, order, user]);

  if (featuresLoading || !isWhatsAppEnabled(features)) return null;

  const digits = indiaWaDigits(phone);

  const send = () => {
    if (!digits) {
      toast.error("No valid mobile number on this record");
      return;
    }
    const ok = openWhatsApp(phone, text);
    if (ok) toast.success("WhatsApp opened with the message — tap Send there");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Message copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const inner = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-tz-navy">WhatsApp update</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Opens WhatsApp with a filled message. Nothing is sent until you tap Send in WhatsApp.
          </p>
        </div>
        {variant === "modal" && (
          <button type="button" onClick={onClose} className="text-xs font-semibold underline">
            Close
          </button>
        )}
      </div>

      <p className="text-xs text-gray-600">
        To: {phone || "—"} {digits ? `(+${digits})` : "(invalid / missing)"}
      </p>

      {mode === "order" && (
        <label className="block text-xs font-medium text-gray-700">
          Template
          <select
            className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm bg-white"
            value={ORDER_WA_TEMPLATES.some((t) => t.id === templateId) ? templateId : "summary"}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {ORDER_WA_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <textarea
        className="w-full border rounded-xl px-3 py-2 text-sm min-h-[220px] font-sans"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!digits}
          onClick={send}
          className="px-4 py-2 rounded-xl bg-[#25D366] text-white text-sm font-semibold disabled:opacity-50"
        >
          Open WhatsApp
        </button>
        <button
          type="button"
          onClick={copy}
          className="px-4 py-2 rounded-xl border text-sm font-semibold"
        >
          Copy text
        </button>
      </div>
    </div>
  );

  if (variant === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3 no-print" onClick={onClose}>
        <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {inner}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-tz-pink-soft p-5 no-print">{inner}</section>
  );
};

export default WhatsAppCompose;
