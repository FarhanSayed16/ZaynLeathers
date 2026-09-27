import { useContext } from "react"
import { ShopContext } from "../context/ShopContext"

const CheckoutSummary = () => {
  const { formatPrice, getCartAmount, getShippingFee } = useContext(ShopContext)
  const sub = getCartAmount()
  const shipping = getShippingFee ? getShippingFee(sub) : 0

  return (
    <div className="bg-white p-6 rounded-xl shadow sticky top-24 h-fit">
      <h2 className="text-xl font-semibold mb-4">🧾 Order Summary</h2>

      <div className="flex justify-between mb-2">
        <span>Subtotal</span>
        <span>{formatPrice(getCartAmount())}</span>
      </div>

      <div className="flex justify-between mb-2">
        <span>Shipping</span>
        <span>{shipping === 0 && sub > 0 ? "Free" : formatPrice(shipping)}</span>
      </div>

      <hr className="my-3" />

      <div className="flex justify-between font-semibold text-lg">
        <span>Total</span>
        <span>{formatPrice(sub + shipping)}</span>
      </div>

      <button
        type="submit"
        className="w-full mt-6 bg-tz-navy text-white hover:bg-tz-pink hover:text-white transition-colors duration-300 py-3 rounded-lg hover:opacity-90 transition"
      >
        PLACE ORDER
      </button>
    </div>
  )
}

export default CheckoutSummary