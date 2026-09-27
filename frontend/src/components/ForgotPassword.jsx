import React, { useState } from 'react'
import { toast } from 'react-toastify'
import * as shopApi from '../api/shopApi'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await shopApi.forgotPassword(email)
      if (response.success !== false) {
        toast.success(response.message || 'Reset link sent')
      } else {
        toast.error(response.message)
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
      console.error(err)
    }
  }

  return (
    <div className=' px-4 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]'>
      <form onSubmit={handleSubmit} className=' flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
        <p className=' text-3xl mb-2 mt-10'>Forgot Password</p>
        <input type="email" placeholder="Enter your email" className="w-full px-3 py-2 border border-gray-800" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit" className=" bg-tz-navy text-white hover:bg-tz-pink hover:text-white transition-colors duration-300 px-8 py-2 mt-4">Send Reset Link</button>
      </form>
    </div>
  )
}

export default ForgotPassword
