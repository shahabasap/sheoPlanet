const User = require('../models/userModel');
const Product = require('../models/ProductModel');
const Banner=require('../models/BannerModel')



// home page--------------------------
const homepage = async (req, res, next) => {
  try {
    const allproducts = await Product.find({ is_listed: 1, is_deleted: 0 })
    const WomensProduct = await Product.find({ pgender: 'Women', is_listed: 1, is_deleted: 0 })
    const MenProduct = await Product.find({ pgender: 'Men', is_listed: 1, is_deleted: 0 })
    const userStatus = await User.findOne({ email: req.session.user, is_Blocked: 0 })
    const BannerData=await Banner.find({is_listed:1})

    // if the user is already exists destroy the session  whe the user is  blocked by admin-----------------
    if (!userStatus && req.session.user) {
      res.render('403')
    }
    else if (req.session.user && userStatus) {
      next();
    }
    else if (req.session.Otp) {
      res.redirect('/OtpPage')
    }
    else {
      res.render('home', { allproducts, WomensProduct, MenProduct,BannerData})
    }


  } catch (error) {
    console.log(error.message);
  }
}

// Otp page-----------------------------
const OtpPage = async (req, res, next) => {
  try {

    if (req.session.Otp) {

      next();

    }
    else if (req.session.user) {
      res.redirect('/')
    }
    else {
      res.redirect('/register')
    }


  } catch (error) {
    console.log(error.message);
  }
}


// register Page----------------------

const registerPage = async (req, res, next) => {
  try {
    console.log(req.session.Otp)
    console.log(req.session.user)

    if (req.session.user) {
      res.redirect('/')
    }
    else if (req.session.Otp) {
      res.redirect('/OtpPage')
    }
    else {
      next();
    }


  } catch (error) {
    console.log(error.message);
  }
}

// login page-------------------------------
const loginPage = async (req, res, next) => {
  try {

    if (req.session.user) {
      res.redirect('/')
    }
    else if (req.session.Otp) {
      res.redirect('/OtpPage')
    }
    else {
      next();
    }


  } catch (error) {
    console.log(error.message);
  }
}

// login post----------------------------
const loginPagePost = async (req, res, next) => {
  try {

    if (req.session.user) {
      res.redirect('/')
    }
    else if (req.session.Otp) {
      res.redirect('/OtpPage')
    }
    else {
      next();
    }


  } catch (error) {
    console.log(error.message);
  }
}

// Whole page session handling-----------
const UserSideSession = async (req, res, next) => {
  try {

    if (req.session.user) 
    {
      next();
    }
    else
    {
        redirect('/')
    }
    

  } catch (error) {
    console.log(error.message);
  }
}

module.exports = {
  homepage,
  OtpPage,
  registerPage,
  loginPage,
  loginPagePost,
  UserSideSession
}