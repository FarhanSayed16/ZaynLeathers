import userModel from "../models/userModel.js"

// add products to user cart
const addToWishlist = async(req,res)=>{
    try {
      if (!req.user?._id || req.isAdmin) {
        return res.json({ success: false, message: "Please login as a customer to use wishlist." });
      }
      const userId = req.user._id;
      const { productId } = req.body;

         const user = await userModel.findById(userId);
         if (!user) return res.json({ success: false, message: "User not found" });
     
         // Prevent duplicates
         if (!user.wishlist.includes(productId)) {
           user.wishlist.push(productId);
           await user.save();
         }
     
         res.json({ success: true, message: "Added to wishlist" });
    } catch (error) {
      console.log(error)
      res.json({success:false,message:error.message})
    }
}


// update  user cart
const updateWishlist = async(req,res)=>{
    try {
      if (!req.user?._id || req.isAdmin) {
        return res.json({ success: false, message: "Please login as a customer to use wishlist." });
      }
      const userId = req.user._id;
      const { productId } = req.body;

      const user = await userModel.findById(userId);
      if (!user) return res.json({ success: false, message: "User not found" });
  
      user.wishlist = user.wishlist.filter(id => id !== productId);
      await user.save();
  
      res.json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
      console.log(error)
      res.json({success:false,message:error.message})
    }
}


// get user cart
const getUserWishlist = async(req,res)=>{
    try {
      if (!req.user?._id || req.isAdmin) {
        return res.json({ success: false, message: "Please login as a customer to use wishlist." });
      }
      const userId = req.user._id;

      const user = await userModel.findById(userId);
      if (!user) return res.json({ success: false, message: "User not found" });
  
      res.json({ success: true, wishlist: user.wishlist });
    } catch (error) {
      console.log(error)
      res.json({success:false,message:error.message})
    }
}

export {addToWishlist,updateWishlist,getUserWishlist} 






