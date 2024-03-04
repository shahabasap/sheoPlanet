const User = require('../models/userModel');
const Product = require('../models/ProductModel');
const Cart = require('../models/CartModel');
const Wishlist = require('../models/wishlistModel');



const cartCount = async (req, res, next) => {
    try {
        if (req.session.user) {
            // If the user is logged in, retrieve user data and cart information
            const userData = await User.findOne({ email: req.session.user });
            const userCart = await Cart.findOne({ userid: userData._id });
            const wishlist = await Wishlist.findOne({ userid: userData._id });

            // Check if the user has a cart and if there are products in the cart
            if (userCart && userCart.products && userCart.products.length !== null) {
                // Set the product count in res.locals.ProductCount
                res.locals.ProductCount = userCart ? userCart.products.length || 0 : 0;

            }
            if (wishlist && wishlist.products && wishlist.products.length !== null) {
                // Set the product count in res.locals.ProductCount
                res.locals.WhishListItems = wishlist ? wishlist.products.length || 0 : 0;

            }
            if (userData) {
                res.locals.loginedPerson = userData ? userData.name : undefined;


            }


            next();
        } else {
            res.locals.ProductCount = 0;
            next();
        }
    } catch (error) {
        // Handle errors by logging the error message
        console.log(error.message);
    }

};


module.exports = { cartCount }