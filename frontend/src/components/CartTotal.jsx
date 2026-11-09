import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'

/**
 * Cart totals — merchandise subtotal matches header cart total (getCartAmount).
 * Order total = subtotal − discount + shipping.
 */
const CartTotal = () => {
  const { formatPrice, getCartAmount, appliedCoupon, getShippingFee } = useContext(ShopContext)

  const subTotal = getCartAmount();
  const discount = !appliedCoupon
    ? 0
    : appliedCoupon.discountType && appliedCoupon.discountType !== "percent" && appliedCoupon.fixedDiscount != null
      ? Math.min(Math.round(Number(appliedCoupon.fixedDiscount)), subTotal)
      : Math.round((Number(appliedCoupon.discount) / 100) * subTotal);
  const shipping = getShippingFee ? getShippingFee(subTotal - discount) : 0;
  const total = subTotal === 0 ? 0 : subTotal + shipping - discount;

  return (
    <div className='w-full'>
      {subTotal > 0 && (
        <div className="flex items-center gap-2 mb-3 bg-[#f8f5f0] p-2.5 rounded border border-tz-pink-soft/60">
          <span className="text-xs font-medium text-tz-navy">
            ✓ Free expedited worldwide shipping included
          </span>
        </div>
      )}

      <div className='space-y-0 text-sm sm:text-base'>
        <div className='flex justify-between items-center py-2.5'>
          <span className='text-gray-600'>
            Items
            <span className="block text-[10px] uppercase tracking-wider text-tz-navy/40 mt-0.5">
              Same as header cart
            </span>
          </span>
          <span className='font-semibold text-tz-navy tabular-nums' data-testid="cart-items-total">
            {formatPrice(subTotal)}
          </span>
        </div>

        <hr className='border-gray-200' />

        {appliedCoupon ? (
          <>
            <div className='flex justify-between items-center py-2.5 text-green-700'>
              <span>Discount ({appliedCoupon.code})</span>
              <span className='font-medium tabular-nums'>- {formatPrice(discount)}</span>
            </div>
            <hr className='border-gray-200' />
          </>
        ) : null}

        <div className='flex justify-between items-center py-2.5'>
          <span className='text-gray-600'>Shipping</span>
          <span className='font-medium tabular-nums'>
            {shipping === 0 && subTotal > 0 ? "Free" : formatPrice(shipping)}
          </span>
        </div>

        <hr className='border-gray-200' />

        <div className='flex justify-between items-center py-3'>
          <span className='text-base sm:text-lg font-bold text-tz-navy'>Order total</span>
          <span className='text-lg sm:text-xl font-bold text-tz-navy tabular-nums' data-testid="cart-order-total">
            {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default CartTotal
