import React from "react";

const ConfirmModal = ({
  open,
  title = "Confirm Action",
  message = "Are you sure?",
  onConfirm,
  onCancel,
  confirmText = "Delete",
  cancelText = "Cancel",
  confirmClass,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-soft w-[90%] max-w-sm p-6 animate-scaleIn border border-tz-pink-soft">
        <h3 className="text-lg font-display font-semibold text-center text-tz-navy">{title}</h3>

        <p className="text-sm text-gray-600 text-center mt-2">
          {message}
        </p>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border bg-tz-cream/80 hover:bg-tz-pink-soft text-sm font-medium"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-xl text-white text-sm font-semibold ${
              confirmClass || "bg-red-500 hover:bg-red-600"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;