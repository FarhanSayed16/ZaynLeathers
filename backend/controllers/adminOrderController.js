import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import { sendEmail } from "../utils/mailer.js";
import brand from "../../shared/brand.config.js";

export const updateStatus = async (req, res) => {
  try {
    const { orderId, itemId, size, status } = req.body;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    const item = order.items.find(
      i => i._id.toString() === itemId && i.size === size
    );

    if (!item) {
      return res.json({ success: false, message: "Item not found" });
    }

    // ❌ Do not allow admin to revert cancellation/delivery
    if (["Cancelled", "Delivered"].includes(item.status)) {
      return res.json({
        success: false,
        message: `Item already ${item.status}`
      });
    }

    // ✅ Stock reduce when shipped
    if (status === "Shipped") {
      await productModel.findByIdAndUpdate(item.productId, {
        $inc: { availableQuantity: -item.quantity }
      });
    }

    // ✅ Update item status
    await orderModel.updateOne(
      { _id: orderId },
      { $set: { "items.$[elem].status": status } },
      { arrayFilters: [{ "elem._id": itemId, "elem.size": size }] }
    );

    // ✅ Update parent order status (optional but useful)
    order.status = status;
    await order.save();

    // ✅ Email notification
    const user = await userModel.findById(order.userId);
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: brand.email.statusUpdatedSubject,
        html: `
          <h2>Hello ${user.name || ""}</h2>
          <p>Your order item status is now:</p>
          <b>${status}</b>
        `
      });
    }

    res.json({
      success: true,
      message: "Status updated successfully"
    });

  } catch (error) {
    console.error("Update Status Error:", error);
    res.json({
      success: false,
      message: error.message
    });
  }
};