import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";

export const cancelItemLogic = async ({ orderId, itemId, size }) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const item = order.items.find(
    i => i._id.toString() === itemId && i.size === size
  );

  if (!item) throw new Error("Item not found");

  if (["Delivered", "Cancelled"].includes(item.status)) {
    throw new Error(`Cannot cancel a ${item.status} item`);
  }

  // Restock if already shipped
  if (["Shipped", "OutForDelivery"].includes(item.status)) {
    await productModel.findByIdAndUpdate(item.productId, {
      $inc: { availableQuantity: item.quantity }
    });
  }

  // Update item status
  await orderModel.updateOne(
    { _id: orderId },
    { $set: { "items.$[elem].status": "Cancelled" } },
    { arrayFilters: [{ "elem._id": itemId, "elem.size": size }] }
  );

  return true;
};