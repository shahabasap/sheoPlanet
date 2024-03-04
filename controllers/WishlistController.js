const User = require('../models/userModel');
const Product = require('../models/ProductModel');
const Wishlist = require('../models/wishlistModel');



// Wishlist------------------------------

const LoadWishList = async (req, res) => {
    try {
      const UserData = await User.findOne({ email: req.session.user });
      const UserId = UserData._id
      const WhishListData=await Wishlist.findOne({userid:UserId}).populate('products.productid')
      
       res.render('wishlist',{WhishListData})
    }
    catch (error) {
      console.log(error.message)
    }
  
  }

// Add to wishlist------------------------------
const addToWishlist = async (req, res) => {
  try {
      const { Pid } = req.params;
      const UserData = await User.findOne({ email: req.session.user });
      const productData = await Product.findOne({ _id: Pid });
      const existWishlist = await Wishlist.findOne({ userid: UserData._id });
      const UserId = UserData._id;

      const WishlistProduct = {
          productid: Pid,
          name: productData.pname,
          image: productData.productImages[0].resizedFile,
      };

      if (existWishlist) {
          existWishlist.products.push(WishlistProduct);
          await existWishlist.save();
      } else {
          const NewWishlist = new Wishlist({
              userid: UserId,
              products: [WishlistProduct],
          });
          await NewWishlist.save();
      }

      res.status(200).json({ message: 'Item added to wishlist successfully' });
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};
// Delete wishlist item-----------------------------------
const deleteWishlistItem = async (req, res) => {
  try {
    const { Pid } = req.params;
   console.log("pid",Pid);
    const UserData = await User.findOne({ email: req.session.user });
    const existWishlist = await Wishlist.findOne({ userid: UserData._id });

    if (!existWishlist) {
      return res.json({ success: false, message: "Wishlist not found" });
    }

    const UpdateWishlist = await Wishlist.updateOne(
      { userid: UserData._id },
      { $pull: { 'products': { productid: Pid } } }
    );

    if (UpdateWishlist) {
      console.log("updated", UpdateWishlist);
      return res.json({ success: true, message: "Item deleted successfully" });
    } else {
      return res.json({ success: false, message: "Item not found in the wishlist" });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


  module.exports={ 
    LoadWishList,
    addToWishlist,
    deleteWishlistItem
}