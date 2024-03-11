
const User = require('../models/userModel');
const OtpModel = require('../models/otpModel');
const Product = require('../models/ProductModel');
const Cart = require('../models/CartModel');
const Coupon = require('../models/CouponModel');
const Order = require('../models/orderModel');
const Token = require('../models/TokenModel');
const bcrypt = require('bcrypt');
const Banner=require('../models/BannerModel')
const crypto = require('crypto');
const Razorpay = require('razorpay');
const moment = require('moment')
const nodemailer = require('nodemailer')
require('dotenv').config();

// '/' Router or home page is  starting---------------------
const homePage = async (req, res) => {
  try {
    const allproducts = await Product.find({ is_listed: 1, is_deleted: 0 })
    const WomensProduct = await Product.find({ pgender: 'Women', is_listed: 1, is_deleted: 0 })
    const MenProduct = await Product.find({ pgender: 'Men', is_listed: 1, is_deleted: 0 })
    const PersonName = await User.findOne({ email: req.session.user })
    const UserCart = await Cart.findOne({ userid: PersonName._id })
    const BannerData=await Banner.find({is_listed:1})

    let ProductCount = 0; // Default value for the case when the cart is empty

    if (UserCart && UserCart.products && UserCart.products.length !== null) {
      ProductCount = UserCart.products.length;
    }
    
    let RegVerifyMessage = req.flash('RegVerify')[0];
    res.render('home', { loginedPerson: PersonName.name, allproducts, WomensProduct, MenProduct, RegVerifyMessage, ProductCount,BannerData })

   

  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
}

// 404 page-------------------

const UnknownPage = async (req, res) => {
  try {
    res.render('404')
  } catch (error) {
    console.log(error.message)
  }
}



// user Registration method----------------------------

// get method is starting---------------------------------

const RegistrationLoad = async (req, res) => {
  try {
    const {RefId}=req.query
    // console.log("load register",RefId);
    res.render('register',{RefId})
  } catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }
}


//becrypt the  password of user-----------------------
const securePasswordUserside = async (password) => {
  try {

    const passwordHash = bcrypt.hash(password, 10)
    return passwordHash;
  } catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }
}

// ------------------------------------------------------------- User regitration----------------------------------------------------------
// Random id genarating-------------------------
function generateRandomId(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomId = '';

  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomId += characters.charAt(randomIndex);
  }

  return randomId;
}


const UserRegistration = async (req, res) => {
  try {
   
    const{unAuthorisedRefId}=req.body
    const Delete_UnVerified_Data = await User.deleteOne({ email: req.body.email, is_varified: 0 })
    if (Delete_UnVerified_Data) {
      console.log( Delete_UnVerified_Data );
    }
    const spassword = await securePasswordUserside(req.body.password);
    const Uaemail = req.body.email
    const userCheck = await User.findOne({ email: Uaemail })
    const RefId=generateRandomId();
    if (!userCheck) {

      const walletDAta={
        amount:10,
        message:"Registration Bonus"
      }
      
      if(unAuthorisedRefId !== undefined || unAuthorisedRefId.trim() !== null )
      {
        // console.log("get in to codition",unAuthorisedRefId);
        const ReferalBonus=await User.findOne({RefId:unAuthorisedRefId})
        if(ReferalBonus)
        {
          ReferalWalletData={
            amount:500,
            message:"Referal Bonus"
          }
          ReferalBonus.walletAmount += 500
          ReferalBonus.wallet_history.push(ReferalWalletData)
          await ReferalBonus.save()
        }
       
      }

      const user = new User({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobileno,
        password: spassword,
        is_admin: 0,
        walletAmount:walletDAta.amount,
        wallet_history:[walletDAta],
        RefId:RefId

      });

      const UserData = await user.save();


      if (UserData) {

        res.redirect(`/send-otp/${Uaemail}`)

      } else {
        res.render('register', { message: 'Your registration failed' });
      }
    }
    else {
      res.render('register', { message: 'your email is already exist' });
    }
  } catch (error) {
    console.log('Error in insertuser:', error); // Log the error for debugging
    res.render('register', { message: 'Your registration failed' });
  }
};

// User Login--------------------------

// login get method------------------------

const loginload = async (req, res) => {
  try {
    const msg = req.flash('success')[0]


    res.render('login', { message: msg })
  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }


}
// login post method-----------------------------

const
  verifyLogin = async (req, res) => {
    try {
      const Comingemail = req.body.email
      const password = req.body.password

      const UserData = await User.findOne({ email: Comingemail, is_varified: 1 })
      const checkBlocking = await User.findOne({ email: Comingemail, is_Blocked: 1 })
      if (!checkBlocking) {
        if (UserData) {

          const passwordMatch = await bcrypt.compare(password, UserData.password)
          if (passwordMatch) {
            req.session.user = req.body.email

            res.redirect('/')

          }
          else {
            res.render('login', { message: "Email and password is incorrect" })
          }

        }
        else {
          res.render('login', { message: "Email and password is incorrect" })
        }
      }
      else {

        res.render('login', { message: "Your Email is  blocked for further checking" })
      }

    } catch (error) {
      res.redirect('/500')
      console.log(error.message)
    }
  }
// User logout--------------------------
const UserLogout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).send("error destroying session")
      }
      else {
        res.redirect('/')
      }
    })

  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
}

// Otp Maitainig Session Started Here--------------------------------------


// Otp Page rendering---------------------
const OtpPage = async (req, res) => {
  try {
    email = req.session.Otp
    res.render('Otp', { email: email })

  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
}
// controllers/otpController.js

function generateOTP() {
  const timestamp = Date.now();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();;
  return { otp, timestamp };
}

// Delet otp collection after 1 minute--------------------

async function deleteOTPAfterDelay(otpData) {
  try {
    await new Promise(resolve => setTimeout(resolve, 60 * 1000)); // Delay for 1 minute
    const OtpExpired = await OtpModel.deleteOne({ otp: otpData.otp });
    // console.log('OTP deleted successfully:', OtpExpired);
  } catch (error) {
    res.redirect('/500')
    console.error('Error deleting OTP:', error);
    // Handle the error appropriately, e.g., log it, send a notification, etc.
  }
}

var CompanyPassword = process.env.CompanyPassword;
// Create a Nodemailer transporter using SMTP
const transporter = nodemailer.createTransport({

  service: 'gmail',
  auth: {
    user: process.env.cEmail,
    pass: CompanyPassword
  }
});


const sendOTP = async (req, res) => {
  try {
    let email = req.params.id;

    // Generate OTP with timestamp
    const otpData = generateOTP();


    // Save OTP to the database
    await OtpModel.create({ email, otp: otpData.otp, timestamp: otpData.timestamp });
    // delete otp collection after 1 minute------------
    deleteOTPAfterDelay(otpData);

    // Send OTP to the email
    const mailOptions = {
      from: 'shahabasmuhammed51@gmail.com',
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP for verification is: ${otpData.otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        // console.log("error",error);
        return res.status(500).json({ error: 'Failed to send OTP' });
      } else {
        req.session.Otp = email
        res.redirect(`/OtpPage`);
      }
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { otpdata } = req.body;
    let email = req.params.id;
    console.log("email",email);
    console.log("otp",otpdata);
    const UserData = await User.findOne({ email })

    // Find the OTP document in the database
    const otpDocument = await OtpModel.findOne({ email:email, otp:otpdata });
    if (!otpDocument) {
       return res.json({verify:false,message:"Otp is incorrect"})
    } else {
      // Check if OTP is still valid based on time limit (e.g., 5 minutes)
      if (!isOTPValid(otpDocument.timestamp)) {
        // Delete the expired OTP document
        await OtpModel.deleteOne({ email: email });
        return res.json({ veritify:false,message: 'OTP has expired' });
      }
      else {

        // Update the "isVerified" field to true in the User collection
        await User.updateOne({ email: email }, { $set: { is_varified: 1 } });

        // Delete the OTP document
        await OtpModel.deleteOne({ email: email });

        ///Otp session is clearing
        req.session.Otp = 0
        //user session is creating
        req.session.user = email
       
        return res.json({verify:true,message:"Registered successfully"})
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
};

// Function to check if OTP is still valid based on time limit (e.g., 5 minutes)
function isOTPValid(timestamp, timeLimit = 1 * 60 * 1000) {
  const currentTime = Date.now();
  return currentTime - timestamp <= timeLimit;
}

// Forget Password towards starting------------------------------

// Forget password page------------------------------------------
const forggetPassword = async (req, res) => {
  try {

    res.render('forggetPassword')

  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
}

//send resent password---------------------------------------------

const sentResetPass = async (req, res) => {
  try {
    const email = req.body.email
    await sendResetPasslink(email, res)
    req.flash('success', 'Check your gmail for further actions');
    res.redirect("/login")
  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
}

// send link to mail for reset password----------------------------
//reset password link

const sendResetPasslink = async (email, res) => {
  try {
    const user = await User.findOne({ email: email })

    if (!user) {
      return res.status(400).send("user with given email doesn't exist");
    } else {

      let token = await Token.findOne({ userId: user._id })


      if (!token) {
       const Tokendata = await new Token({ userId: user._id, token: crypto.randomBytes(32).toString("hex") }).save();
     
        const resetpage = `http://127.0.0.1:3003/resetpassword/?userId=${user._id
          }&tokenid=${Tokendata.token
          }`;


        // Send OTP to the email
        const mailOptions = {
          from: 'shahabasmuhammed51@gmail.com',
          to: email,
          subject: 'OTP Verification',
          text: resetpage
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return res.status(500).json({ error: 'Failed to send OTP' });
          } else {
            req.flash('success', 'Please Check Your Email For Reset Password')
            res.redirect(`/login`);
          }
        });

      }



    }

  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
}

// Reset password Page------------------------------


const resetpassword = async (req, res) => {
  try {
    const userId = req.query.userId
    const token = req.query.tokenid

    res.render('resetPass', { UserId: userId, TokenId: token })

  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
}
// reset password post method---------------------
//reset password

const UpdateResetPassword = async (req, res) => {
  try {
    const userId = req.body.userid;
    const user = await User.findById(userId);
    const { email } = user;

    if (!user) {
      return res.status(400).json({ error: "Invalid user or expired link" });
    }

    const token = req.body.Token;
    const tokenDoc = await Token.findOne({ userId, token });

    if (!tokenDoc) {
      return res.status(400).json({ error: "Invalid link or expired" });
    }

    const newPassword = req.body.confirmpassword;
    const hashedPassword = await securePasswordUserside(newPassword);

    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    req.flash('success', 'Successfully reset your new password');
    res.redirect("/login");
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// Navbar items routing  starting here-----------------------------
// shopping route-------------------
const ShoppingPage = async (req, res) => {
  try {
    const { Gender, Category, Size, ProductSorting, SearchedProduct } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = 9; // Set the number of items per page
    const skip = (page - 1) * limit;
    const totalProducts = await Product.find({ is_listed: 1, is_deleted: 0 }).countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    const sortingValue = parseInt(ProductSorting);
    const filter = { is_listed: 1, is_deleted: 0 };

    if (Gender !=="null" && Gender !== undefined) filter.pgender = Gender;
    if (Category !== "null" && Category !== undefined) {
      filter.pcategory =  Category.toString() ;
    }
    if (Size && !isNaN(Number(Size))) filter.psize = Number(Size);
    if (SearchedProduct) {
      const regex = new RegExp(SearchedProduct.split(/\s+/).join('\\s+'), 'i');
      filter.$or = [
        { pname: regex },  // Assuming product name field is 'pname'
      ];
    }


    const product = await Product.find(filter)
      .populate('pcategory')
      .sort(sortingValue ? { offerprice: 1 } : null)
      .skip(skip)
      .limit(limit);

    if (product.length > 0) {
      res.render('Shopping', { product, currentPage: page, totalPages, skip ,filter,SearchedProduct,sortingValue});
    } else {
      console.log("No products found");
    }

  } catch (error) {
    res.redirect('/500');
    console.log(error.message);
  }
};


// Each product  details  rendering route --------------------using spcified is------------------------
const IndividualProductPage = async (req, res) => {
  try {
    let Pid = req.params.id
    const OneProduct = await Product.findOne({ _id: Pid })
    if(OneProduct)
    {
      res.render('IndividualProduct', { OneProduct })

    }
    else 
    {
      res.render('404')
    }


  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
}

// User dashboard--------------------------------------------------

const UserDash = async (req, res) => {
  try {

    const msg = req.flash('message')[0]

    const UserData = await User.findOne({ email: req.session.user }).populate('address');
    const UserWallet = await User.aggregate([
      { $match: { email: req.session.user } },
      { $unwind: '$wallet_history' },
      { $sort: { 'wallet_history.date': -1 } }
    ]);
    const CouponData=await  Coupon.find({isdelete:false})
    

        const uid = UserData._id
    const UserOrders = await Order.find({ userid: uid }).sort({ date: -1 })
    res.render('dashboard', { UserData, UserOrders, moment, msg,UserWallet ,CouponData})

  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
}
// User dashboard--------------------------------------------------

const UpdateData = async (req, res) => {
  try {

    const Uemail = req.session.user
    const { name, mobile } = req.body

    const UserData = await User.findOne({ email: Uemail })
    if (UserData) {
      const UserUpdate = await User.updateOne({ email: Uemail }, {
        $set: {
          name: name,
          mobile: mobile,
        }
      })

      if (UserUpdate) {
        console.log("Updated succesfully");
        req.flash("message", "Data updated Successfully")
        res.status(200).redirect('/dashboard')
      }
      else {
        console.log("not updated");
        req.flash("message", "Oops Something went wrong !")

        res.status(200).redirect('/dashboard')

      }

    } else {
      res.status(400).json({ message: 'User not found' })
    }


  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
}

// User add address route is starting  right from here--------------------------

const addAddress = async (req, res) => {
  try {
    console.log("Add address is working");
    const { CustomerName, BuildingName, mobile, street, city, state, pincode } = req.body;

    const userData = await User.findOne({ email: req.session.user });

    if (userData) {
      if (userData.address.length > 0) {
        userData.address.push({
          name: CustomerName,
          buildingname: BuildingName,
          mobile: mobile,
          street: street,
          city: city,
          state: state,
          pincode: pincode,
        });
      } else {
        console.log("There are no existing addresses");
        userData.address = [
          {
            name: CustomerName,
            buildingname: BuildingName,
            mobile: mobile,
            street: street,
            city: city,
            state: state,
            pincode: pincode,
          },
        ];
      }

      const update = await userData.save();

      if (update) {
        res.status(200).json({ success: true, message: 'Address added successfully' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to add address' });
      }
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// User dashboard--------------------------------------------------

const EditAddress = async (req, res) => {
  try {
    const { CustomerName, BuildingName, mobile, street, city, state, pincode } = req.body;
    const addressId = req.params.id;
    const email = req.session.user;

    const userAddress = await User.findOne(
      { email: email },
      {
        address: {
          $elemMatch: { _id: addressId }
        }
      }
    );

    if (userAddress) {
      const updateAddress = await User.updateOne(
        { email: email, 'address._id': addressId },
        {
          $set: {
            'address.$.name': CustomerName,
            'address.$.buildingname': BuildingName,
            'address.$.mobile': mobile,
            'address.$.street': street,
            'address.$.city': city,
            'address.$.state': state,
            'address.$.pincode': pincode
          }
        }
      );

      if (updateAddress) {
        res.status(200).json({ message: 'Address updated successfully', success: true });
      } else {
        res.status(400).json({ message: 'Address not updated', success: false });
      }
    } else {
      res.status(400).json({ message: 'User or address not found', success: false });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error', success: false });
  }
};


// delete address---------------------------

const deleteAddress = async (req, res) => {
  try {
    const userId = req.body.userId;
    const addressId = req.body.addressId;

    const result = await User.updateOne(
      { _id: userId },
      { $pull: { address: { _id: addressId } } }
    );

    if (result) {
      return res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } else {
      return res.status(404).json({ success: false, message: 'Address not found or deletion unsuccessful' });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
//  Reset Address---------------------------

const resetPassword = async (req, res) => {
  try {
    const Uid = req.params.id;
    const olderPass = req.body.olderPass;
    const newPass = req.body.newPass;

    const spassword = await securePasswordUserside(newPass);
    const userData = await User.findOne({ _id: Uid });

    if (!userData) {
      return res.status(404).send("User not found");
    }

    const passwordMatch = await bcrypt.compare(olderPass, userData.password);

    if (passwordMatch) {
      const updatePass = await User.updateOne(
        { _id: Uid },
        {
          $set: {
            password: spassword,
          },
        }
      );
      console.log(updatePass);

      if (updatePass) {
        console.log("password is updated");
        return res.status(200).json({ success: true });
      } else {
        console.log("Password is not updated");
        return res.status(500).json({ success: false });
      }
    } else {
      console.log("Old passwrd is incorect");
      return res.json("Old password is incorect");
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Internal Server Error");
  }
};



// Cart controlles  starting from here---------------------------

const CartPage = async (req, res) => {
  try {
    email = req.session.user
    const userId = await User.findOne({ email: email })
    const cartExist = await Cart.findOne({ userid: userId._id }).populate('products.productid')
    res.render('cart', { cartExist })

  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
}

// item added to cart----------------
const addToCart = async (req, res) => {
  try {
    const PID = req.params.id;
    const { ProductQuantity } = req.body;
    const pqty = parseInt(ProductQuantity)

    const product = await Product.findOne({ _id: PID });
    const stock = product.pquantity
    var DeliveryCharge


    if (stock > 0) {
      if (!product) {
        return res.status(404).send('Product not found');
      }

      const user = await User.findOne({ email: req.session.user });

      if (!user) {
        return res.status(404).send('User not found');
      }

      const cartExist = await Cart.findOne({ userid: user._id });

      if (cartExist) {
        const existingProductIndex = cartExist.products.findIndex(
          (p) => p.productid.toString() === PID
        );
        if (existingProductIndex !== -1) {
          
            return res.json({ExistProduct:true})

        } else {
          // Add a new product to the cart
          cartExist.products.push({
            productid: product._id,
            name: product.pname,
            price: product.offerprice,
            quantity: pqty,
            ActualPrice:product.pprice,
            totalprice: pqty * product.offerprice,
            image: product.productImages[0].resizedFile,
          });
        }

        // Save the cart
        await cartExist.save();

        // Calculate the grand total using aggregation
        const grandTotalResult = await Cart.aggregate([
          {
            $match: { userid: user._id },
          },
          {
            $unwind: "$products"
          },
          {
            $group: {
              _id: '$userid',
              grandTotal: { $sum: '$products.totalprice' },
            },
          },
          {
            $project: { _id: 0 },
          },
        ]);
        if(grandTotalResult[0].grandTotal>2000)
        {
          console.log("value is greater");
          DeliveryCharge=0;
        }else{
          console.log("value is lower");
          DeliveryCharge=50;
        }

        // Update the grand total of the cart
        await Cart.updateOne(
          { userid: user._id },
          {
            $set: {
              deliveryCharge:DeliveryCharge,
              grandTotal:DeliveryCharge+ grandTotalResult[0].grandTotal,
            },
          }
        );

        return res.json( { success: true });
      } else {
        
        // Create a new cart
        const offerprice = product.offerprice;
        const total = pqty * offerprice;
        let DeliveryChargenew=0
        if(total>2000)
        {
          DeliveryChargenew=0;
        }else{
          DeliveryChargenew=50;
        }

        const cart = new Cart({
          userid: user._id,
          products: [
            {
              productid: product._id,
              name: product.pname,
              price: offerprice,
              quantity: pqty,
              totalprice: total,
              image: product.productImages[0].resizedFile,
              ActualPrice:product.pprice,
            },
          ],
          grandTotal: DeliveryChargenew + total,
          deliveryCharge:DeliveryChargenew
        });
       

       
        await cart.save();

        return res.json({ success: true });
      }
    }
    else {

      return res.json({ stockout: true });
    }

  } catch (error) {
    console.log(error.message);
    return res.status(500).send('Internal Server Error');
  }
};


// quantity update controlles  starting from here---------------------------
const quantityUpdate = async (req, res) => {
  try {

    const pid = req.params.id
    const { ProductQuantity } = req.body
    const pqty = parseInt(ProductQuantity)
    var DeliveryCharge

    const UserData = await User.findOne({ email: req.session.user })
    const product = await Product.findOne({ _id: pid });
    const UID = UserData._id

    const cartExist = await Cart.findOne({ userid: UID });
    if (cartExist) {

      const existingProductIndex = cartExist.products.findIndex(
        (p) => p.productid.toString() === pid
      );
      if (existingProductIndex !== -1) {
        // Update quantity and total price for an existing product
        cartExist.products[existingProductIndex].quantity = pqty;
        cartExist.products[existingProductIndex].totalprice =
          pqty * product.offerprice;
        var qt = cartExist.products[existingProductIndex].quantity
        var TotalPrice = cartExist.products[existingProductIndex].totalprice



      }
      // Save the cart
      await cartExist.save();

      // Calculate the grand total using aggregation
      const grandTotalResult = await Cart.aggregate([
        {
          $match: { userid: UID },
        },
        {
          $unwind: "$products"
        },
        {
          $group: {
            _id: '$userid',
            grandTotal: { $sum: '$products.totalprice' },
          },
        },
        {
          $project: { _id: 0 },
        },
      ]);

      if(grandTotalResult[0].grandTotal>2000)
        {
          DeliveryCharge=0;
        }else{
          DeliveryCharge=50;
        }


      // Update the grand total of the cart
      await Cart.updateOne(
        { userid: UID },
        {
          $set: {
            grandTotal:DeliveryCharge + grandTotalResult[0].grandTotal,
            deliveryCharge:DeliveryCharge,

          },
        }
      );
      const grandTotalRecheking = await Cart.findOne({ userid: UID })
      

      res.send({ Gprice: grandTotalRecheking.grandTotal, ptotal: TotalPrice })

    }
    else {
      console.log("cart not exist");
    }


  } catch (error) {
    console.log(error.message);
  }
}
// deleteItem from cart  starting from here---------------------------
const deleteProduct = async (req, res) => {
  try {
    const pid = req.params.id
    const userData = await User.findOne({ email: req.session.user })
    const userid = userData._id
    const updateCart = await Cart.updateOne({ userid: userid }, {
      $pull: {
        products: { productid: pid }
      }
    })
    const userCart=await Cart.findOne({userid: userid })
    let DeliveryCharge
    if (userCart.products.length==0) {
      return res.json({arrlen:true})
    }
    else if (updateCart) {
      // Calculate the grand total using aggregation
      const grandTotalResult = await Cart.aggregate([
        {
          $match: { userid: userid },
        },
        {
          $unwind: "$products"
        },
        {
          $group: {
            _id: '$userid',
            grandTotal: { $sum: '$products.totalprice' },
          },
        },
        {
          $project: { _id: 0 },
        },
      ]);
      if( grandTotalResult[0].grandTotal>2000)
        {
          DeliveryCharge=0;
        }else{
          DeliveryCharge=50;
        }

      // Update the grand total of the cart
      await Cart.updateOne(
        { userid: userid },
        {
          $set: {
            deliveryCharge:DeliveryCharge,
            grandTotal:DeliveryCharge + grandTotalResult[0].grandTotal,
          },
        }
      );
     return res.json(200,{success:true})
    } else {

    return  res.status(404).send("cart is not deleted")
    }
  } catch (error) {

    res.redirect('/500')
    console.error(error);
  }
}
// checkout controlles  starting from here---------------------------
const CheckoutPage = async (req, res) => {
  try {
    const UserData = await User.findOne({ email: req.session.user })
    const userid = UserData._id
    const UserCart = await Cart.findOne({ userid: userid })
    res.render('checkout', { UserData, UserCart })
    req.session.Checkout = req.session.user


  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
}

//checkoutAddadress  add address route is starting  right from here--------------------------

const chAddAdress = async (req, res) => {
  try {
    console.log("Check out is working");
    const { CustomerName, BuildingName, mobile, street, city, state, pincode } = req.body

    const UserData = await User.findOne({ email: req.session.user })

    if (UserData) {

      if (UserData.address.length > 0) {

        UserData.address.push(
          {

            name: CustomerName,
            buildingname: BuildingName,
            mobile: mobile,
            street: street,
            city: city,
            state: state,
            pincode: pincode
          }
        )

        const Update = await UserData.save()

        if (Update) {
          res.redirect('/Checkout')
          console.log('updated second one successfully');
        }
        else {
          res.redirect('/Checkout')
          console.log('not updated');
        }

      }

      else {
        console.log("There is no elements");
        UserData.address =
          [
            {
              name: CustomerName,
              buildingname: BuildingName,
              mobile: mobile,
              street: street,
              city: city,
              state: state,
              pincode: pincode

            },
          ]

        const Update = await UserData.save()

        if (Update) {

          res.redirect('/Checkout')
          console.log('updated successfully');
        }
        else {

          res.redirect('/Checkout')
          console.log('not updated');
        }

      }


    }
    else {
      res.send("User not found")
    }


  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
}
// Apply coupon-------------------------------------
const ApplyCoupon = async (req, res) => {
  try {
    const UserData = await User.findOne({ email: req.session.user });
    const { CouponCode } = req.body;
    const CouponValied = await Coupon.findOne({ code: CouponCode });
    const CartData = await Cart.findOne({ userid: UserData._id });
    const currentDate = new Date();
    const expireDate = new Date(CouponValied.expireDate);
    var newGrandTotal = 0;

    if (!CouponValied) {
      res.json({failed:true});
    } else {
      if (CouponValied.useduser.length === 0 && CartData.grandTotal >= CouponValied.minamount) {
        if(currentDate<=expireDate)
        {
          newGrandTotal = CartData.grandTotal - CouponValied.offeramount;
          res.json({ apply: true, newGrandTotal: newGrandTotal,offerAmount:CouponValied.offeramount,couponId:CouponValied._id });
        }
        else
        {
          res.json({exceed:true,message:"The coupon is expired"})
        }
      }else if( CartData.grandTotal <CouponValied.minamount)
      {
        res.json({amount:false,message:`You need to purchase with minimum ${CouponValied.minamount} Rupees `})
      }
       else {
        const CouponValiedUser = await Coupon.findOne({
          code: CouponCode,
          'useduser.userid': UserData._id,
          'useduser.usedstatus': true  // Changed to false to check for unused coupons
        });

        if (!CouponValiedUser && CartData.grandTotal >= CouponValied.minamount) {
          if(currentDate<=expireDate)
          {
            newGrandTotal = CartData.grandTotal - CouponValied.offeramount;
            res.json({ apply: true, newGrandTotal: newGrandTotal,offerAmount:CouponValied.offeramount,couponId:CouponValied._id });
          }
          else
          {
            res.json({exceed:true,message:"The coupon is expired"})
          }
         
        } else {
          res.json({ apply: false });
        }
      }
    }
  } catch (error) {
    res.redirect('/500')
    console.log(error.message);
  }
};




// 404 error-------------------------
const errorPage = async (req, res) => {
  try {
    
     res.render('404')
  }
  catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }

}
// 500 server side error-------------------------
const servereError = async (req, res) => {
  try {
    
     res.render('500')
  }
  catch (error) {
    
    console.log(error.message)
  }

}



module.exports = {
 
  loginload,
  UserRegistration,
  RegistrationLoad,
  verifyLogin,
  UserLogout,
  sendOTP,
  verifyOTP,
  ShoppingPage,
  IndividualProductPage,
  homePage,
  OtpPage,
  UserDash,
  addAddress,
  EditAddress,
  UpdateData,
  CartPage,
  CheckoutPage,
  addToCart,
  quantityUpdate,
  deleteProduct,
  chAddAdress,
  deleteAddress,
  resetPassword,
  forggetPassword,
  sentResetPass,
  resetpassword,
  UpdateResetPassword,
  UnknownPage,
  errorPage,
  ApplyCoupon,
  servereError


}