const User = require('../models/userModel');
const Product = require('../models/ProductModel');
const Category = require('../models/CategoryModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/CouponModel');
const Banner=require('../models/BannerModel')
const moment = require('moment');
const path=require('path')
const sharp = require('sharp');
const { resolve } = require('path');



// '/admin' route is used here-----------------------------------
const loginloadadmin = async (req, res) => {
  try {

    res.render('login');


  } catch (error) {
    console.log(error.message);
  }
}


// login admin methods--------------------------------------------
const verifyLoginadmin = async (req, res) => {
  try {
    const Comingemail = req.body.mail;
    const password = req.body.password;
    require('dotenv').config(); // Make sure to install dotenv: npm install dotenv
    const envEmail = process.env.adminEmail;
    const envPassword = process.env.adminPassword;

    if (password == envPassword && Comingemail == envEmail) {
      req.session.admin = req.body.mail
      res.redirect('/admin/adminhome')

    }
    else {
      res.render('login', { invalid: "Email and password is incorrect" })
    }



  } catch (error) {
    console.log(error.message)
  }
}
// home page of admin method started------------------------------------------
const adminhomePage = async (req, res) => {
  try {
    const RevenueCalculation = await Order.aggregate([
      {
        $match: { status: 'Delivered' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" } // Replace "total" with your actual field name if needed
        }
      }

    ]);
    const Revenue = RevenueCalculation.length > 0 ? RevenueCalculation[0].total : 0;

    const salesCalculation = await Order.aggregate([
      {
        $match:
          { status: { $in: ['Cancel Order', 'Return Order'] } }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" } // Replace "total" with your actual field name if needed
        }

      }
    ])
    const Sales = salesCalculation.length > 0 ? salesCalculation[0].total : 0;

    const OrderCalculation = await Order.countDocuments();
    const DeliveredOrders = await Order.find({ status: 'Delivered' }).countDocuments();
    const DeliveryPendings = await Order.aggregate([
      {
        $match: {
          status: { $in: ['Placed', 'Shipping'] }
        }
      },
      {
        $group: {
          _id: 0,
          total: { $sum: 1 }
        }
      }
    ]);
    const DeliveryPendingCount = DeliveryPendings.length > 0 ? DeliveryPendings[0].total : 0;

    const NonProfitable = await Order.aggregate([
      {
        $match: {
          status: { $in: ['Cancel Order', 'Return Order'] }
        }
      },
      {
        $group: {
          _id: 0,
          total: { $sum: 1 }
        }
      }
    ]);
    const NonProfitableOrders = NonProfitable.length > 0 ? NonProfitable[0].total : 0;

    // Chart calculations Start from here------------------------------------------
    //orders
    // const user=await User.find()

    const currentYear = new Date().getFullYear()
    const yearsToInclude = 4
    const currentMonth = new Date().getMonth()

    const defalutMonthsValues = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
      count: 0,
    }))

    const defaultYearlyValues = Array.from(
      { length: yearsToInclude },
      (_, i) => ({
        year: currentYear - yearsToInclude + i + 1,
        total: 0,
        count: 0,
      })
    );

    //monthly sales Data

    const monthlySales = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          date: { $gte: new Date(currentYear, currentMonth - 1, 1) },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          data: { $push: { total: "$total" } },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          total: { $sum: "$data.total" },
          count: { $size: "$data" },
        },
      },
    ]);

    const updatedMonthlyValues = defalutMonthsValues.map((defaultMonth) => {
      const foundMonth = monthlySales.find(
        (monthData) => monthData.month === defaultMonth.month
      );
      return foundMonth || defaultMonth;
    });

    // Yearly Sales--------------------------

    const YearlySales = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          date: { $gte: new Date(currentYear - yearsToInclude, 0, 1) }
        },
      },
      {
        $group: {
          _id: { $year: "$date" },
          data: { $push: { total: "$total" } },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id",
          total: { $sum: "$data.total" },
          count: { $size: "$data" },
        },
      },
    ]);

    const updatedYearlyValues = defaultYearlyValues.map((defaultYear) => {
      const foundYear = YearlySales.find(
        (yearData) => yearData.year == defaultYear.year
      );
      return foundYear || defaultYear;
    });

// Best Selling items-------------------------------
// best selling product-----------------
let Productsids = [];
let CategoryIds = [];
const bestSellingProducts = await Order.aggregate([
  { $match: { status: 'Delivered' } },
  { $unwind: '$products' },
  {
    $group: {
      _id: '$products.productid',
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 5 }
]);

bestSellingProducts.forEach((n) => {
  Productsids.push(n._id);
});


// Correct variable name in the next line
const FindBestSellingProducts = await Product.find({ _id: { $in: Productsids } }).populate('pcategory')

// best selling caegory-----------------------

const categoryCounts = await Order.aggregate([
  {
    $match: {
      status: "Delivered"
    }
  },
  {
    $unwind: "$products"
  },
  {
    $lookup: {
      from: "products", // Assuming your product collection is named "products"
      localField: "products.productid",
      foreignField: "_id",
      as: "productInfo"
    }
  },
  {
    $unwind: "$productInfo"
  },
  {
    $group: {
      _id: "$productInfo.pcategory",
      count: { $sum: 1 }
    }
  }
  ,{ $sort: { count: -1 } },
  { $limit: 5 }
]);


categoryCounts.forEach((n) => {
  CategoryIds.push(n._id);
});
const FindBestSellingCategory = await Category.find({ _id: { $in: CategoryIds } })








    res.render('home', { Revenue, Sales, OrderCalculation, DeliveredOrders, DeliveryPendingCount, NonProfitableOrders, updatedMonthlyValues, updatedYearlyValues,FindBestSellingProducts,FindBestSellingCategory,categoryCounts,bestSellingProducts});

  } catch (error) {
    console.log(error.message);
  }
}
//---------------------------------------------------------------------------- logout Admin  method---------------------------------------

const logoutDesroyAdmin = async (req, res) => {
  try {

    req.session.destroy((err) => {
      if (err) {
        console.log('session is not  destroyed')
      }
      else {
        res.redirect('/admin')

      }

    })


  } catch (error) {
    console.log(error.message);
  }
}


// delete user from admin page---------------------------------
const deleteuser = async (req, res) => {
  try {
    const comingId = req.params.id;
    const deletingMailId = await User.findOne({ _id: comingId }, { _id: 0, email: 1 })
    const DeletingUserName = deletingMailId.email
    if (req.session.user && req.session.user == DeletingUserName) {
      req.session.user = null
    }

    await User.findByIdAndDelete(comingId);

    // Fetch the updated list of users
    const users = await User.find()

    // Pass the users data to the adminpage template
    res.render('adminpage', { users });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};






// get method of update submit-------------------------
const updatesubmitget = async (req, res) => {
  try {
    const comingupId3 = req.params.id;

    const upUser3itration = await User.findOne({ _id: comingupId3 })

    res.render('update', { val: comingupId3, n: upUser3itration, message: 'The entered username is already existing' });
  }
  catch (error) {
    console.log(error.message)
  }
}



// user Management is starting here---------------------------

const UserManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 7; // Set the number of items per page
    const skip = (page - 1) * limit;
    const totalProducts = await User.find().countDocuments()
    const totalPages = Math.ceil(totalProducts / limit);

    const UserData = await User.find().skip(skip).limit(limit)
    res.render('UserManagement', { UserData, currentPage: page, totalPages, limit });
  }
  catch (error) {
    console.log(error.message)
  }
}
// blocking a user---------------------------

const BlockingUser = async (req, res) => {
  try {

    let comingId = req.params.id
    const checkingBlocked = await User.findOne({ _id: comingId }, { _id: 0, is_Blocked: 1 })
    if (checkingBlocked.is_Blocked == 1) {
      await User.updateOne({ _id: comingId }, { $set: { is_Blocked: 0 } })
      res.redirect('/admin/UserManagement')
    }
    else {
      await User.updateOne({ _id: comingId }, { $set: { is_Blocked: 1 } })
      res.redirect('/admin/UserManagement')

    }

  }
  catch (error) {
    console.log(error.message)
  }
}
//  order mangement---------------------------

const orderManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 7; // Set the number of items per page
    const skip = (page - 1) * limit;
    const totalProducts = await Order.find().countDocuments()
    const totalPages = Math.ceil(totalProducts / limit);

    const Orders = await Order.find().sort({ date: -1 }).populate('userid').skip(skip).limit(limit)
    res.render("OrderManagement", { Orders, moment, currentPage: page, totalPages, skip })

  }
  catch (error) {
    console.log(error.message)
  }
}
// Order staus-------------------

const OrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const newStatus = req.body.selectedValue;
    const ReturnReason = req.body.ReturnReason
    const UserOrder = await Order.findOne({ _id: orderId })
    if (!UserOrder) {
      res.status(404).json({ message: 'Order not found' })
    }
    else {
      const UpdateOrder = await Order.updateOne({ _id: orderId }, { $set: { status: newStatus } })
      if (UpdateOrder) {
        if (newStatus === 'Return Order' && (UserOrder.payment === 'Razorpay' || UserOrder.payment === 'wallet')) {
          const walletHistory = {
            amount: UserOrder.total,
            reason: ReturnReason,
          };
          console.log("conditon", UserOrder.userid);
          // wallet is updating------------------------
          const updateWallet = await User.updateOne(
            { _id: UserOrder.userid },
            {
              $inc: { walletAmount: UserOrder.total },
              $push: { wallet_history: walletHistory },
            }
          );

          console.log("hi", updateWallet, ReturnReason);
        }
        res.status(200).json({ success: 'Status updated', status: UserOrder.status });
      } else {
        res.status(404).json({ message: 'Status not updated' });
      }

    }

  }
  catch (error) {
    console.log(error.message)
  }


}


// sales Report routes--------------------
const salesReport = async (req, res) => {
  try {
    const ascendingOrderByDate = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $sort: { date: 1 } }
    ]);
    const descendingOrderByDate = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $sort: { date: -1 } }
    ]);
    const startDate = moment(ascendingOrderByDate[0].date).format('YYYY-MM-DD');
    const endDate = moment(descendingOrderByDate[0].date).format('YYYY-MM-DD');
    const SalesReport = await Order.aggregate([{ $match: { status: 'Delivered' } }])
    res.render('salesReport', { SalesReport, moment, startDate, endDate })
    // console.log("slaes",SalesReport)

  } catch (error) {
    console.error(error.message)
  }
}
// Sales Report Searching by date-----------------

const SRsearchByDate = async (req, res) => {
  try {
    const { Start, End } = req.body
    const startDateObj = new Date(Start)
    startDateObj.setHours(0, 0, 0, 0)
    const endDateObj = new Date(End)
    endDateObj.setHours(23, 59, 59, 999)

    const SortedReport = await Order.aggregate([
      {
        $match: {
          date: {
            $gte: startDateObj,
            $lte: endDateObj
          }
          ,
          status: 'Delivered'
        }
      }])
    if (SortedReport) {
      return res.status(200).json({ salaesReport: SortedReport })

    }
  } catch (error) {
    return res.status(404).send("Sort By date is failed")
  }
}


// -----------------------Coupon mangemnt---------------------------------------------

const LoadCouponManagment = async (req, res) => {
  try {
    const CouponData = await Coupon.find({isdelete:false})
    const message=req.flash('message')[0]
    res.render('CouponManagment', { CouponData, moment,message })

  } catch (error) {
  }
}
// load  add coupon page----------------
const LoadAddCoupon = async (req, res) => {
  try {
    const message=req.flash('message')[0]
    res.render('AddCoupon',{message})

  } catch (error) {
  }
}
// adding coupons-----------
const AddCoupon = async (req, res) => {
  try {
    const { couponName, couponCode, couponDescription, ExprDate, MinAmount, offerAmount } = req.body
    const ExistCouponCode = await Coupon.findOne({ code: couponCode })
    if (!ExistCouponCode) {
      const CouponData = new Coupon({
        name: couponName,
        code: couponCode,
        description: couponDescription,
        expireDate: ExprDate,
        minamount: MinAmount,
        offeramount: offerAmount,

      })
      await CouponData.save()
      req.flash("message","New coupon is added  added successfully")
      res.redirect('/admin/CouponManagment')
    }
    else {
      req.flash("message",`${couponCode} coupon code is already exists`)
      res.redirect(`/admin/loadAddcoupon`)

    }

  } catch (error) {
  }
}
// Load Edit coupon page--------------------------
const loadEditCoupon = async (req, res) => {
  try {
    const { id } = req.params
    const message=req.flash('message')[0]
    const CouponData = await Coupon.findOne({ _id: id })
    res.render('EditCoupon', { CouponData, moment,message })

  } catch (error) {
  }
}
// Editing coupon----------------------------------
const EditCoupon = async (req, res) => {
  try {
    const { couponName, couponCode, couponDescription, ExprDate, MinAmount, offerAmount, couponid } = req.body
    const existsCouponcode = await Coupon.findOne({ code: couponCode })
    const CurrentCoupon = await Coupon.findOne({ _id: couponid })


    if (!existsCouponcode || CurrentCoupon.code === couponCode) {
      const UpdateCoupon = await Coupon.updateOne({ _id: couponid }, {
        $set:
        {
          name: couponName,
          code: couponCode,
          description: couponDescription,
          expireDate: ExprDate,
          minamount: MinAmount,
          offeramount: offerAmount,

        }
      })
      if (UpdateCoupon) {
        req.flash("message", "Coupon edited successfully")
        res.redirect('/admin/CouponManagment')
      }
      else {
        req.flash("message", "Coupon is not edited")
        res.redirect(`/admin/loadEditCoupon/${couponid}`)

      }


    }
    else {
      req.flash("message", `${couponCode} coupon code is already exists`)
      res.redirect(`/admin/loadEditCoupon/${couponid}`)

    }



  } catch (error) {
    res.status(500).json("Internal server error")
  }
}
// delete coupon--------------
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params
    const CouponData = await Coupon.findOne({ _id: id })
    if (!CouponData) {
      res.status(404).json("Coupon not found")
    } else {
      const DeleteCoupon= await Coupon.updateOne({_id:id},{
        $set:
        {
          isdelete:true
        }
      }) 
      if(DeleteCoupon)
      {
        res.status(200).json({success:true})
      }
      else
      {
        res.json({success:false})

      }
    }
  } catch (error) {
    res.status(500).json("server side error")
  }
}

// ----------------------------------------------------------------------Banner Managment----------------------------------------------------
// load banner page--------------------------
const LoadBannerMangement = async (req, res) => {
  try {
    const message=req.flash('message')[0]
    const BannerData=await Banner.find()
    res.render('BannerManegement',{message,BannerData})

  } catch (error) {
    console.log(error);
  }
}
// load add banner----------------------
const LoadAddBanner = async (req, res) => {
  try {
    
    res.render('AddBanner')

  } catch (error) {
    console.log(error);
  }
}
// Add banner---------------------------------------
const AddBanner = async (req, res) => {
  try {
    const{ Btitle,Bdescription,Burl }=req.body
    const file=req.file
    const BannerImage=(file)=>{
      return new Promise(async(resolve,reject)=>{
        try {
       

        const result= {
          filename: file.filename,
          path: file.path,
     
        };
        resolve(result);
          
        } catch (error) {
          reject(error);
        }
      })
    }
    
    try {
      const result = await BannerImage(file);
       
      
      const newBanner = new Banner({
        title: Btitle,
        Url:Burl,
        image: result.filename,
        description: Bdescription,
      });

      await newBanner.save();
      req.flash('message',"New banner added successfullly")
      res.redirect('/admin/BannerMangement')

    } catch (error) {
      console.log('Error resizing image or saving banner:', error);
    }
   
   

  } catch (error) {
    console.log(error);
  }
}


// Banner status----------------------------------
const Listing = async (req, res) => {
  try {
    
    const{BannerId,Status}=req.body
    console.log("dat",req.body);
    const checkingListed = await Banner.findOne({ _id: BannerId }, { _id: 0, is_listed: 1 })
    if (Status == 1) {
      await Banner.updateOne({ _id: BannerId }, { $set: { is_listed: 0 } })
      res.json({success:true,message:"Banner Unlisted successfully"})
    }
    else {
      await Banner.updateOne({ _id: BannerId }, { $set: { is_listed: 1 } })
      res.json({success:true,message:"Banner listed successfully"})

    }

 

  } catch (error) {
    console.log(error);
  }
}

// load edit page-------------------
const LoadEditBanner = async (req, res) => {
  try {
     const{id}=req.params
     const BannerData=await Banner.findOne({_id:id})
    res.render('EditBanner',{BannerData})

  } catch (error) {
    console.log(error);
  }
}
// editing banner--------------------------

const EditBanner = async (req, res) => {
  try {
   
    const { Btitle, Bdescription, Burl, Bannerid } = req.body;
    const file = req.file;
    

    if (file !=undefined) {
      const BannerImage = (file) => {
        return new Promise(async (resolve, reject) => {
          try {
            const result = {
              filename: file.filename,
              path: file.path,
            };
            resolve(result);
          } catch (error) {
            reject(`Error processing image: ${error}`);
          }
        });
      };

      try {
        const result = await BannerImage(file);

        const BannerData = await Banner.findOne(
          { _id: Bannerid }
        );
        BannerData.title= Btitle,
        BannerData.Url=Burl,
        BannerData.description=Bdescription
        BannerData.image=result.filename;
        const UpdateBannerData= await BannerData.save()
  
        if (UpdateBannerData) {
          req.flash('message', 'Banner updated successfully');
          res.redirect('/admin/BannerMangement');
          console.log('Updated');
        }
        else
        {
          req.flash('message', 'Banner updation failed');
          res.redirect('/admin/BannerMangement');
        }
        
      } catch (error) {
        console.log('Error resizing image or saving banner:', error);
        // Handle the error, redirect or respond appropriately
      }
    } else {
      const BannerData = await Banner.findOne(
        { _id: Bannerid }
      );
      BannerData.title= Btitle,
      BannerData.Url=Burl,
      BannerData.description=Bdescription
      const UpdateBannerData= await BannerData.save()

      if (UpdateBannerData) {
        req.flash('message', 'Banner updated successfully');
        res.redirect('/admin/BannerMangement');
        console.log('Updated');
      }
      else
      {
        req.flash('message', 'Banner updation failed');
          res.redirect('/admin/BannerMangement');
      }
    }
  } catch (error) {
    console.log(error);
    // Handle the error, redirect or respond appropriately
  }
};





module.exports = {
  verifyLoginadmin,
  loginloadadmin,
  adminhomePage,
  logoutDesroyAdmin,
  deleteuser,
  updatesubmitget,
  UserManagement,
  BlockingUser,
  orderManagement,
  OrderStatus,
  salesReport,
  SRsearchByDate,
  LoadCouponManagment,
  LoadAddCoupon,
  AddCoupon,
  loadEditCoupon,
  EditCoupon,
  deleteCoupon,
  LoadBannerMangement,
  LoadAddBanner,
  AddBanner,
  Listing,
  LoadEditBanner,
  EditBanner
}
