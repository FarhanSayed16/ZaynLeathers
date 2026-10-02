import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'

/**
 * Cart totals — merchandise subtotal matches header cart total (getCartAmount).
 * Order total = subtotal − discount + shipping.
 */
const CartTotal = () => {
  const { formatPrice, getCartAmount, appliedCoupon, getShippingFee, settings } = useContext(ShopContext)

  const subTotal = getCartAmount();
  const discount = !appliedCoupon
    ? 0
    : appliedCoupon.discountType && appliedCoupon.discountType !== "percent" && appliedCoupon.fixedDiscount != null
      ? Math.min(Math.round(Number(appliedCoupon.fixedDiscount)), subTotal)
      : Math.round((Number(appliedCoupon.discount) / 100) * subTotal);
  const shipping = getShippingFee ? getShippingFee(subTotal - discount) : 0;
  const total = subTotal === 0 ? 0 : subTotal + shipping - discount;
  const threshold = Number(settings?.freeShippingThreshold) || 0;
  const remaining = threshold > 0 ? Math.max(0, threshold - (subTotal - discount)) : 0;

  return (
    <div className='w-full'>
      <div className='mb-4'>
        <Title text1={"CART"} text2={"TOTAL"} />
      </div>

      {threshold > 0 && subTotal > 0 && (
        <div className="mb-4">
          {remaining > 0 ? (
            <p className="text-xs text-tz-navy/70 mb-1">
              Add {formatPrice(remaining)} more for free shipping
            </p>
          ) : (
            <p className="text-xs text-green-700 mb-1">You have free shipping on this order</p>
          )}
          <div className="h-1.5 bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-tz-navy transition-[width] duration-300"
              style={{
                width: `${Math.min(100, ((threshold - remaining) / threshold) * 100)}%`,
              }}
            />
          </div>
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
