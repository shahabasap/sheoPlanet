const User = require('../models/userModel');
const Product = require('../models/ProductModel');
const Category = require('../models/CategoryModel');



// Category manamgement is starting here-------------------------

const CategoryManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 7; // Set the number of items per page
    const skip = (page - 1) * limit;
    const totaCategory = await Category.find().countDocuments()
    const totalPages = Math.ceil(totaCategory / limit);
    let CategoryAddedMessage = req.flash('Cmessage')[0];
    // Edit category flash messages--------------------------
    let updated = req.flash('catsuccess')[0];
    // let Notupdated=req.flash('Cmessage')[0];



    const categories = await Category.find().skip(skip).limit(limit)
    res.render('CategoryManagement', { categories, CategoryAddedMessage, updated, currentPage: page, totalPages, skip });
  }
  catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }
}
// Add Category--------------------

// Page rendering-----------------------
const AddCategoryPage = async (req, res) => {
  try {
    let categoryAlreadyExists = req.flash('CEmessage')[0];
    let categoryNotAdded = req.flash('CNmessage')[0];

    res.render('AddCategory', { categoryAlreadyExists, categoryNotAdded });
  }
  catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }
}
// post method ----------Category  adding----------------------------------------------
const AddCategory = async (req, res) => {
  try {
    const cname = req.body.cname
    let filter={}
    regex = new RegExp(cname, "i");
    filter.$or = [
      { Cname: regex }
  ];

    const categoryChecking = await Category.findOne(filter)
    if (!categoryChecking) {

      const category = new Category({
        Cname: req.body.cname,
        Cdescription: req.body.cdescription,
      });
      const ProductData = await category.save();

      if (ProductData) {
        req.flash('Cmessage', 'Category succcesfully added ')
        res.redirect('/admin/CategoryManagement')
      } else {
        req.flash('CNmessage', 'Category not added')
        res.redirect('/admin/AddCategory')


      }
    }
    else {
      req.flash('CEmessage', 'Category is already exists')
      res.redirect('/admin/AddCategory')
    }

  }
  catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }
}

// Category listing-----------------------------


const CategoryListing = async (req, res) => {
  try {

    let comingId = req.params.id
    const checkingListed = await Category.findOne({ _id: comingId }, { _id: 0, is_listed: 1 })
    if (checkingListed.is_listed == 1) {
      await Category.updateOne({ _id: comingId }, { $set: { is_listed: 0 } })
      res.redirect('/admin/CategoryManagement')
    }
    else {
      await Category.updateOne({ _id: comingId }, { $set: { is_listed: 1 } })
      res.redirect('/admin/CategoryManagement')

    }

  }
  catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }
}

// Edit Category------------------------
// rendering the edit category page----------------------

const  loadEditCategory= async (req, res) => {
  try {

    let comingId = req.params.id
    let Duplicaion = req.flash('DuplicationCname')[0];
    const category = await Category.findOne({ _id: comingId })
    res.render('EditCategory', { category, Duplicaion })


  }
  catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }
}
// editing category--------------

const editCategory  = async (req, res) => {

  try {

    let comingId = req.params.id
    const { cname, cdescription } = req.body
    let filter={}

    regex = new RegExp(cname, "i");
    filter.$or = [
      { Cname: regex }
  ];

    const CategoryName = await Category.findOne(filter)
    const CurrentCategory = await Category.findOne({ _id: comingId })


    if (!CategoryName || CategoryName.Cname === CurrentCategory.Cname) 
    {
      const UpdatCategory = await Category.updateOne({ _id: comingId }, { $set: { Cname: cname, Cdescription: cdescription } })
      if (UpdatCategory) {
        req.flash('catsuccess', `${cname} category updated successfully`)
        res.redirect('/admin/CategoryManagement')
      }
      else {
        req.flash('catsuccess', ` category is not updated successfully`)
        res.redirect('/admin/CategoryManagement')
      }
    }
    else {
      req.flash('DuplicationCname', `${cname} is already existing category name `)
      res.redirect(`/admin/loadEditCategory/${comingId}`)


    }
  }
  catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }
}







module.exports = {
  AddCategory,
  AddCategoryPage,
  CategoryManagement,
  CategoryListing,
  editCategory,
  loadEditCategory
}