const express = require('express');
const multer = require('multer');
const admin_route = express();
const adminController = require('../controllers/adminController')
const categoryController = require('../controllers/CategoryController')
const productController = require('../controllers/productController')
const adminsideMiddleware = require('../Middleware/adminMiddleware')
const multerMiddleware = require('../Middleware/MulterMiddleware')



admin_route.set('view engine', 'ejs')
admin_route.set('views', './views/admin/adminPages')

const upload = multer({ storage: multerMiddleware.storage });


admin_route.get('/', adminsideMiddleware.adminRootpage, adminController.loginloadadmin)
admin_route.post('/adminlog', adminController.verifyLoginadmin)
admin_route.get('/adminhome', adminsideMiddleware.adminSessionControll, adminController.adminhomePage)
admin_route.get('/logoutadmin', adminController.logoutDesroyAdmin)

// --------------------------------------------------------Navbar Routes-------------------------------------------------------------------------------------------------------------------------
admin_route.get('/UserManagement', adminsideMiddleware.adminSessionControll, adminController.UserManagement)
admin_route.get('/blocking/:id', adminsideMiddleware.adminSessionControll, adminController.BlockingUser)

// Product Management-------------------------------------------------------
admin_route.get('/ProductManagement', adminsideMiddleware.adminSessionControll, productController.ProductManagement)
admin_route.get('/AddProduct', adminsideMiddleware.adminSessionControll, productController.AddProductPage)
admin_route.get('/listing/:id', adminsideMiddleware.adminSessionControll, productController.listingProduct)
admin_route.post('/AddProduct', upload.array('productImages', 4), productController.AddProduct);
admin_route.get('/editProduct/:id', adminsideMiddleware.adminSessionControll, productController.LoadEditProduct);
admin_route.post('/LoadEditedProduct/:id', upload.array('productImages', 4), productController.editProduct);
admin_route.get('/deletePhoto/', adminsideMiddleware.adminSessionControll, productController.deleteProductImage);
admin_route.get('/deleteProduct/:id', adminsideMiddleware.adminSessionControll, productController.deleteProduct);
admin_route.post('/uploadCroppedImage/',upload.any(),  productController.uploadCroppedImg);




// category management------------------------------------------------------------
admin_route.get('/CategoryManagement', adminsideMiddleware.adminSessionControll, categoryController.CategoryManagement)
admin_route.get('/AddCategory', adminsideMiddleware.adminSessionControll, categoryController.AddCategoryPage)
admin_route.post('/AddCategory', categoryController.AddCategory)
admin_route.get('/loadEditCategory/:id', adminsideMiddleware.adminSessionControll, categoryController.loadEditCategory)
admin_route.post('/editCategory/:id', categoryController.editCategory)
admin_route.get('/Catlisting/:id', adminsideMiddleware.adminSessionControll, categoryController.CategoryListing)


// Order Managemt ------------------------------
admin_route.get('/OrderMangement/', adminsideMiddleware.adminSessionControll, adminController.orderManagement)
admin_route.post('/updateStatus/:id', adminController.OrderStatus)




// database methods---------------------------------------
admin_route.post('/delete/:id', adminsideMiddleware.adminSessionControll, adminController.deleteuser)
admin_route.get('/updateVal/:id', adminsideMiddleware.adminSessionControll, adminController.updatesubmitget)

// Sales Report------------------------------------------
admin_route.get('/salesReport/', adminsideMiddleware.adminSessionControll, adminController.salesReport)
admin_route.post('/SalesReporSearch/', adminsideMiddleware.adminSessionControll, adminController.SRsearchByDate)


// Coupon Managment----------------------------
admin_route.get('/CouponManagment', adminsideMiddleware.adminSessionControll, adminController.LoadCouponManagment)
admin_route.get('/loadAddcoupon', adminsideMiddleware.adminSessionControll, adminController.LoadAddCoupon)
admin_route.post('/addCoupon', adminsideMiddleware.adminSessionControll, adminController.AddCoupon)
admin_route.get('/loadEditCoupon/:id', adminsideMiddleware.adminSessionControll, adminController.loadEditCoupon)
admin_route.post('/editCoupon/', adminsideMiddleware.adminSessionControll, adminController.EditCoupon)
admin_route.get('/deleteCoupon/:id', adminsideMiddleware.adminSessionControll, adminController.deleteCoupon)

// Banner Management----------------------------------------
admin_route.get('/BannerMangement', adminsideMiddleware.adminSessionControll, adminController.LoadBannerMangement)
admin_route.get('/LoadAddBanner', adminsideMiddleware.adminSessionControll, adminController.LoadAddBanner)
admin_route.post('/AddBanner',upload.single('Bimage'),adminController.AddBanner);
admin_route.post('/Listing',adminsideMiddleware.adminSessionControll,adminController.Listing);
admin_route.post('/Listing',adminsideMiddleware.adminSessionControll,adminController.Listing);
admin_route.get('/LoadEditBanner/:id',adminsideMiddleware.adminSessionControll,adminController.LoadEditBanner);
admin_route.post('/EditBanner',upload.single('Bimage'),adminController.EditBanner);





module.exports = admin_route;