import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { toast } from 'react-toastify'
import * as shopApi from '../api/shopApi'

const CouponInput = () => {
  const { token, appliedCoupon, setAppliedCoupon, getCartAmount } =
    useContext(ShopContext)
  const [code, setCode] = useState('')
  const [hints, setHints] = useState([])

  useEffect(() => {
    let cancelled = false
    shopApi
      .getActiveCoupons()
      .then((res) => {
        if (!cancelled && res.success) setHints(res.coupons || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleApplyCoupon = async (raw) => {
    const value = (raw || code).trim()
    if (!value) return
    if (!token) {
      toast.error('Sign in to apply a coupon')
      return
    }
    try {
      const amount = getCartAmount ? getCartAmount() : 0
      const res = await shopApi.validateCoupon(value, amount)

      if (res.valid) {
        setAppliedCoupon({
          code: (res.code || value).toUpperCase(),
          discount: res.discount,
          discountType: res.discountType,
          fixedDiscount: res.fixedDiscount,
        })
        const label =
          res.discountType && res.discountType !== 'percent' && res.fixedDiscount
            ? `₹${res.fixedDiscount} OFF`
            : `${res.discount}% OFF`
        toast.success(`Coupon applied! ${label}`)
        setCode('')
      } else {
        setAppliedCoupon(null)
        toast.error(res.error || res.message || 'Invalid coupon')
      }
    } catch (err) {
      setAppliedCoupon(null)
      toast.error(err.response?.data?.error || err.message || 'Invalid coupon')
    }
  }

  return (
    <div className="mb-5">
      {appliedCoupon ? (
        <div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded text-sm">
          <p>
            <b>{appliedCoupon.code}</b>{' '}
            ({appliedCoupon.discountType && appliedCoupon.discountType !== 'percent' && appliedCoupon.fixedDiscount
              ? `₹${appliedCoupon.fixedDiscount} OFF`
              : `${appliedCoupon.discount}% OFF`})
          </p>
          <button
            type="button"
            onClick={() => setAppliedCoupon(null)}
            className="text-red-500 text-xs"
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyCoupon()
              }}
              placeholder="Coupon code"
              className="flex-1 border px-3 py-2 rounded text-sm"
            />
            <button
              type="button"
              onClick={() => handleApplyCoupon()}
              className="bg-tz-navy text-white hover:bg-tz-pink hover:text-white transition-colors duration-300 px-4 rounded text-sm"
            >
              Apply
            </button>
          </div>
          {hints.length > 0 && (
            <p className="text-[11px] text-tz-navy/55 mt-2">
              Available:{' '}
              {hints.map((c, i) => (
                <button
                  key={c.code}
                  type="button"
                  className="font-semibold underline mr-1"
                  onClick={() => {
                    setCode(c.code)
                    handleApplyCoupon(c.code)
                  }}
                >
                  {c.code}
                  {c.discount ? ` (${c.discount}% off)` : ''}
                  {i < hints.length - 1 ? ',' : ''}
                </button>
              ))}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default CouponInput
