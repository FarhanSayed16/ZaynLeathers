import express from 'express'
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'
import {placeOrder,placeOrderStripe,placeOrderRazorpay,placeOrderPartial,verifyPartial,collectBalance,refundAdvance,allOrders,userOrders,updateStatus, cancelOrder, verifyRazorpay, orderDetails, getOrderById, getAdminOrderById, dashboardStats} from '../controllers/orderController.js'

const orderRouter = express.Router()

// admin features
orderRouter.post('/list',adminAuth ,allOrders)
orderRouter.post('/status',adminAuth ,updateStatus)
orderRouter.post('/cancel', authUser, cancelOrder);

// admin cancel (same logic)
orderRouter.post('/admin-cancel', adminAuth, cancelOrder);
orderRouter.post('/collect-balance', adminAuth, collectBalance);
orderRouter.post('/refund-advance', adminAuth, refundAdvance);

orderRouter.get("/dashboard", adminAuth, dashboardStats);
orderRouter.get("/admin/:id", adminAuth, getAdminOrderById);


// payment features
orderRouter.post('/place', authUser, placeOrder)
orderRouter.post('/stripe',authUser,placeOrderStripe)
orderRouter.post('/razorpay',authUser, placeOrderRazorpay)
orderRouter.post('/partial', authUser, placeOrderPartial)

// Verify Payment
orderRouter.post('/verifyRazorpay',authUser,verifyRazorpay)
orderRouter.post('/verifyPartial', authUser, verifyPartial)

// user feature in frontend
orderRouter.post('/userorders',authUser,userOrders)
orderRouter.get('/orderDetails/:userId',authUser,orderDetails)
orderRouter.get('/:id',authUser,getOrderById)


export default orderRouter