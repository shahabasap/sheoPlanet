const express = require('express');
const multer = require('multer')
// const path=require('path')
const user_route = express();
const userController = require('../controllers/userController')
const usersideMiddlware = require('../Middleware/userMiddleware')
const cartCount = require('../Middleware/AllRounder')
const orderController = require('../controllers/orderController')
const wishlistController = require('../controllers/WishlistController')
const mapController=require('../controllers/mapController.js')




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


// user dashboard----------------------------------------.
user_route.get('/dashboard',usersideMiddlware.UserSideSession, userController.UserDash)
user_route.post('/UpdateUser',usersideMiddlware.UserSideSession, userController.UpdateData)
user_route.post('/addaddress',usersideMiddlware.UserSideSession, userController.addAddress)
user_route.post('/editAddress/:id',usersideMiddlware.UserSideSession, userController.EditAddress)
user_route.post('/deleteAddress/',usersideMiddlware.UserSideSession, userController.deleteAddress)
user_route.post('/resetPassword/:id',usersideMiddlware.UserSideSession, userController.resetPassword)

// Wish list-------------------------------------------------

user_route.get('/wishlist', wishlistController.LoadWishList)
user_route.post('/addToWishlist/:Pid',usersideMiddlware.UserSideSession, wishlistController.addToWishlist)
user_route.get('/deleteWishlistItem/:Pid',usersideMiddlware.UserSideSession, wishlistController.deleteWishlistItem)


// Usercart-----------------------------------------------------
user_route.get('/cart', userController.CartPage)
user_route.get('/deleteProduct/:id', userController.deleteProduct)
user_route.post('/quantityUpdate/:id', userController.quantityUpdate)
user_route.post('/addToCart/:id', userController.addToCart)

// User Checkout--------------------------

user_route.get('/Checkout', userController.CheckoutPage)
user_route.post('/chAddadress', userController.chAddAdress)

// Order rountes  of user side-----------------------------

user_route.post('/placeOrder/:id',usersideMiddlware.UserSideSession, orderController.OrderPost)
user_route.post('/orderCancellation/:id',usersideMiddlware.UserSideSession, orderController.OrderCancel)
user_route.get('/OrderSuccess',usersideMiddlware.UserSideSession,  orderController.OrderSuccess)
user_route.get('/orderFailed/:id',usersideMiddlware.UserSideSession,  orderController.orderFailed)
user_route.post('/verify-Payment',usersideMiddlware.UserSideSession, orderController.VerifyPayment)
user_route.post('/failedRazorPayment',usersideMiddlware.UserSideSession, orderController.failedRazorPayment)
user_route.post('/retryRazorPayment',usersideMiddlware.UserSideSession, orderController.retryRazorPayment )
user_route.post('/retryVerifyPayment',usersideMiddlware.UserSideSession, orderController.retryVerifyPayment )
user_route.get('/orderDetails/',usersideMiddlware.UserSideSession, orderController.OrderDetails)
user_route.post('/ReturnOrderRequest/:id',usersideMiddlware.UserSideSession, orderController.ReturnOrder)
user_route.get('/loadInvoice/:id',usersideMiddlware.UserSideSession, orderController.loadInvoice)
user_route.get('/IndividualOrderDetails/:id',usersideMiddlware.UserSideSession, orderController.IndividualOrderDetails)
user_route.post('/proceedTocheckoutqty/',usersideMiddlware.UserSideSession, orderController.quantityInCheckout)

// delivery charge using google map
user_route.post('/DeliveryCharge/',usersideMiddlware.UserSideSession, mapController.getDistance)



// Coupons-------------------------------------

user_route.post('/ApplyCoupon',usersideMiddlware.UserSideSession, userController.ApplyCoupon)


// Undefined Route comes------------------------------
user_route.get('*', userController.errorPage)

// Server side error page------------------------------
user_route.get('/500', userController.servereError)
















module.exports = user_route;