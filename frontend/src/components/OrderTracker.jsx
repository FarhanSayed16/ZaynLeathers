import { motion } from "framer-motion";

const steps = ["OrderPlaced", "Shipped", "OutForDelivery", "Delivered"];

const OrderTracker = ({ status }) => {
  const activeIndex = steps.indexOf(status);

  return (
    <div className="flex justify-between mt-6">
      {steps.map((step, index) => (
        <div key={step} className="flex-1 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center
              ${index <= activeIndex ? "bg-green-500 text-white" : "bg-gray-300"}`}
          >
            ✓
          </motion.div>
          <p className="text-xs mt-2">{step.replace(/([A-Z])/g, " $1")}</p>
        </div>
      ))}
    </div>
  );
};

export default OrderTracker;