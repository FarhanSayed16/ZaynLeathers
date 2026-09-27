import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const CustomAlert = ({
  show,
  title,
  message,
  type = "success",
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Cancel",
}) => {
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Alert Card */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-white w-[90%] max-w-md rounded-2xl shadow-2xl p-6 text-center space-y-4">
              
              <h2
                className={`text-2xl font-bold ${
                  type === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {title}
              </h2>

              <p className="text-gray-600">{message}</p>

              <div className="flex justify-center gap-4 pt-4">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                  >
                    {cancelText}
                  </button>
                )}

                <button
                  onClick={onConfirm}
                  className={`px-6 py-2 rounded-lg text-white transition ${
                    type === "success"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomAlert;