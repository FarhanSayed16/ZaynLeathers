import express from 'express'
import authUser from '../middleware/auth.js'
import { addToWishlist, getUserWishlist, updateWishlist } from '../controllers/WishlistController.js'

const wishlistRouter = express.Router()

wishlistRouter.post('/get',authUser,getUserWishlist)
wishlistRouter.post('/add',authUser,addToWishlist)
wishlistRouter.post('/update',authUser,updateWishlist)

export default wishlistRouter