const express = require('express');
const multer = require('multer')
// const path=require('path')
const user_route = express();
const userController = require('../controllers/userController')
const usersideMiddlware = require('../Middleware/userMiddleware')
const cartCount = require('../Middleware/AllRounder')
const orderController = require('../controllers/orderController')
const wishlistController = require('../controllers/WishlistController')




user_route.set('view engine', 'ejs')
user_route.set('views', './views/users/UserPages')


// counting cart  products--------------------

user_route.use(cartCount.cartCount)



user_route.get('/', usersideMiddlware.homepage, userController.homePage)
// User registration ---------------------------------------
user_route.post('/registration', userController.UserRegistration)
user_route.get('/register', usersideMiddlware.registerPage, userController.RegistrationLoad)

// user login and log out------------------------
user_route.post('/login', usersideMiddlware.loginPagePost, userController.verifyLogin)
user_route.get('/logout', userController.UserLogout)
user_route.get('/login', usersideMiddlware.loginPage, userController.loginload)


// Otp session--------------------------------
user_route.get('/send-otp/:id', userController.sendOTP)
user_route.get('/OtpPage', usersideMiddlware.OtpPage, userController.OtpPage)
user_route.post('/verify-otp/:id', userController.verifyOTP)
user_route.get('/forgetPassword', userController.forggetPassword)
user_route.post('/sentResetPass', userController.sentResetPass)
user_route.get('/resetpassword/', userController.resetpassword)
user_route.post('/UpdateResetPassword/', userController.UpdateResetPassword)


// Nav bar main main routes-------------------------------------

user_route.get('/Shopping', userController.ShoppingPage)
user_route.get('/Product/:id', userController.IndividualProductPage)
user_route.post('/FilterProduct', userController.FilterCategory)


// user dashboard----------------------------------------.
user_route.get('/dashboard',usersideMiddlware.UserSideSession, userController.UserDash)
user_route.post('/UpdateUser', userController.UpdateData)
user_route.post('/addaddress', userController.addAddress)
user_route.post('/editAddress/:id', userController.EditAddress)
user_route.post('/deleteAddress/', userController.deleteAddress)
user_route.post('/resetPassword/:id', userController.resetPassword)

// Wish list-------------------------------------------------

user_route.get('/wishlist', wishlistController.LoadWishList)
user_route.post('/addToWishlist/:Pid', wishlistController.addToWishlist)
user_route.get('/deleteWishlistItem/:Pid', wishlistController.deleteWishlistItem)


// Usercart-----------------------------------------------------
user_route.get('/cart', userController.CartPage)
user_route.get('/deleteProduct/:id', userController.deleteProduct)
user_route.post('/quantityUpdate/:id', userController.quantityUpdate)
user_route.post('/addToCart/:id', userController.addToCart)

// User Checkout--------------------------

user_route.get('/Checkout', userController.CheckoutPage)
user_route.post('/chAddadress', userController.chAddAdress)

// Order rountes  of user side-----------------------------

user_route.post('/placeOrder/:id', orderController.OrderPost)
user_route.post('/orderCancellation/:id', orderController.OrderCancel)
user_route.get('/OrderSuccess',usersideMiddlware.UserSideSession,  orderController.OrderSuccess)
user_route.get('/orderFailed/:id',usersideMiddlware.UserSideSession,  orderController.orderFailed)
user_route.post('/verify-Payment', orderController.VerifyPayment)
user_route.post('/failedRazorPayment', orderController.failedRazorPayment)
user_route.post('/retryRazorPayment', orderController.retryRazorPayment )
user_route.post('/retryVerifyPayment', orderController.retryVerifyPayment )
user_route.get('/orderDetails/', orderController.OrderDetails)
user_route.post('/ReturnOrderRequest/:id', orderController.ReturnOrder)
user_route.get('/loadInvoice/:id', orderController.loadInvoice)
user_route.get('/IndividualOrderDetails/:id', orderController.IndividualOrderDetails)



// Coupons-------------------------------------

user_route.post('/ApplyCoupon', userController.ApplyCoupon)


// Undefined Route comes------------------------------
user_route.get('*', userController.errorPage)

// Server side error page------------------------------
user_route.get('/500', userController.servereError)
















module.exports = user_route;