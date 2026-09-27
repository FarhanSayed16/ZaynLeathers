import React, { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import * as shopApi from '../api/shopApi'

const ResetPassword = () => {
  const [password, setPassword] = useState('')
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await shopApi.resetPassword(token, password, email)
      if (res.success !== false) {
        toast.success(res.message || 'Password updated')
        navigate('/login')
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err.message || 'Reset failed')
    }
  }

  return (
    <div className=' px-4 sm:px-[5vw] md:px-[7vw] lg:px-[8vw]'>
      <form onSubmit={handleSubmit} className=' flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
        <p className=' text-3xl mb-2 mt-10'>Reset Password</p>
        <input type="password" placeholder="New Password" className="w-full px-3 py-2 border border-gray-800" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className=" bg-tz-navy text-white hover:bg-tz-pink hover:text-white transition-colors duration-300 px-8 py-2 mt-4">Update Password</button>
      </form>
    </div>
  )
}

export default ResetPassword
