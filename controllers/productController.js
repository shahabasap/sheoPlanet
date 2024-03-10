const User = require('../models/userModel');
const Product = require('../models/ProductModel');
const Category = require('../models/CategoryModel');
const sharp = require('sharp');
const path = require('path');





// product management--------------------------------
const ProductManagement = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 7; // Set the number of items per page
    const skip = (page - 1) * limit;
    const totalProducts = await Product.find({ is_deleted: 0 }).countDocuments()
    const totalPages = Math.ceil(totalProducts / limit);


    const successMessage = req.flash('message')[0];
    const Products = await Product.find({ is_deleted: 0 }).skip(skip).limit(limit).populate('pcategory')
    res.render('ProductManagement', { Products, successMessage, currentPage: page, totalPages, skip });

  }
  catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }
}

// Add product--------------------

// Page rendering-----------------------
const AddProductPage = async (req, res) => {
  try {
    let ErrorMessage = req.flash('message')[0]
    const Categories = await Category.find({ is_listed: 1 })
    res.render('AddProduct', { Categories, ErrorMessage });

  }
  catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }
}
// /Post  method add product into db is working here------------------------------


const AddProduct = async (req, res) => {
  try {

    const pname = req.body.pname;
    const CurrentDate = Date().toLocaleString()

    // Process the uploaded images, filter out duplicates
    const productImages = await Promise.all(req.files.map(async (file) => {
      try {
        
        return {
          filename: file.filename,
          path: file.path,
          resizedFile: file.filename,

        };
      } catch (error) {
        console.error('Error processing and saving image:', error);
        return null; // Exclude failed images
      }
    }))



    // Validate if productImages array is not empty before using it
    if (productImages.length === 0) {
      console.log('No valid images were processed.');
      return res.status(400).send('Invalid images');
    }

    const productChecking = await Product.findOne({ pname: pname });

    if (!productChecking) {
      const product = new Product({
        pname: req.body.pname,
        pcolor: req.body.pcolor,
        psize:parseInt( req.body.psize),
        pprice:parseInt(req.body.pprice),
        offerprice:parseInt(req.body.offerprice) ,
        pquantity: parseInt(req.body.pquantity),
        pcategory: req.body.pcategory,
        pdescription: req.body.pdescription,
        pgender: req.body.pgender,
        added_date: CurrentDate,
        productImages: productImages,
      });

      const productData = await product.save();

      if (productData) {

        // Add a flash message
        req.flash('message', 'Product added successfully');
        return res.redirect('/admin/ProductManagement');
      } else {
        req.flash('message', 'Product is not added');
        return res.redirect('/admin/AddProduct');
      }
    } else {
      req.flash('message', 'Product with the same name already exists');
      return res.render('admin/AddProduct'); // Correct the render path
    }
  } catch (error) {
    console.error(error.message);
    res.redirect('/500')  }
};




// Product listing ---------------------------
const listingProduct = async (req, res) => {
  try {

    let comingId = req.params.id
    const checkingListed = await Product.findOne({ _id: comingId }, { _id: 0, is_listed: 1 })
    if (checkingListed.is_listed == 1) {
      await Product.updateOne({ _id: comingId }, { $set: { is_listed: 0 } })
      res.redirect('/admin/ProductManagement')
    }
    else {
      await Product.updateOne({ _id: comingId }, { $set: { is_listed: 1 } })
      res.redirect('/admin/ProductManagement')

    }

  }
  catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }
}

// edit Product-----------------------------
// Render edit product pagee------------------------------------------

const LoadEditProduct = async (req, res) => {
  try {
    let Pid = req.params.id;
    const categories = await Category.find({ is_listed: 1 })
    const productData = await Product.findOne({ _id: Pid }).populate(('pcategory'))



    res.render('EditProduct', { ProductId: Pid, categories, productData });
  }
  catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }
}

// load Edit product  Page---------------------------

const editProduct = async (req, res) => {
  try {
    const Pid = req.params.id;
    const Pname = req.body.pname;




    // Process the uploaded images, filter out duplicates
    const productImages = await Promise.all(req.files.map(async (file) => {
      try {
        const resizedFilename = `resized-${file.filename}`;
        const resizedPath = path.join(__dirname, '../public/uploads', resizedFilename);

        await sharp(file.path)
          .resize({ height: 500, width: 550, fit: 'fill' })
          .toFile(resizedPath);

        return {
          filename: file.filename,
          path: file.path,
          resizedFile: resizedFilename,

        };
      } catch (error) {
        console.error('Error processing and saving image:', error);
        return null; // Exclude failed images
      }
    }))




    const existingProduct = await Product.findOne({ _id: Pid });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found.' });
    }


    // Update product details
    existingProduct.pname = req.body.pname;
    existingProduct.pcolor = req.body.pcolor;
    existingProduct.psize = parseInt(req.body.psize);
    existingProduct.pprice = parseInt(req.body.pprice);
    existingProduct.offerprice = parseInt(req.body.offerprice);
    existingProduct.pquantity = parseInt(req.body.pquantity);
    console.log("quantity99999999999999",req.body.pquantity);
    existingProduct.pcategory = req.body.pcategory;
    existingProduct.pdescription = req.body.pdescription;
    existingProduct.pgender = req.body.pgender;


    if (!Array.isArray(productImages) || productImages.length === 0) {


      // Save updated product
      await existingProduct.save();

      req.flash('message', `${Pname} is edited success fully`)
      res.redirect('/admin/ProductManagement');


    }
    else {
      let maxImageCount = 4
      // Update image array, handling max image count
      const remainingSlots = maxImageCount - existingProduct.productImages.length;

      if (productImages.length > remainingSlots) {
        existingProduct.productImages = productImages.slice(0, maxImageCount);
      } else {
        existingProduct.productImages.push(...productImages);
      }

      // Save updated product
      await existingProduct.save();
      req.flash('message', `${Pname} is edited success fully`)
      res.redirect('/admin/ProductManagement');

    }
  } catch (error) {
    console.error(error.message);
    res.redirect('/500')  }
};

// Delete Product Image-----------------------

const deleteProductImage = async (req, res) => {
  try {
    let Pid = req.query.pid;
    let ImageCollectionIndex = req.query.image;

    let ProductChecking = await Product.findOne({ _id: Pid }, { _id: 0, productImages: 1 });



    if (!ProductChecking) {
      return res.status(404).json({ error: 'Product not found.' });
    } else {
      const is_deleted = await Product.updateOne(
        { _id: Pid },
        { $pull: { productImages: { $eq: ProductChecking.productImages[ImageCollectionIndex] } } }
      );


      if (is_deleted.modifiedCount > 0) {
        res.redirect(`/admin/editProduct/${Pid}`);
        console.log('Image is deleted');
      } else {
        res.redirect(`/admin/editProduct/${Pid}`);
        console.log('Image is not deleted');
      }
    }
  } catch (error) {
    console.log(error.message);
    res.redirect('/500')  }
};


// Soft delte of a product------------------------------------

const deleteProduct = async (req, res) => {
  try {
    let Pid = req.params.id;
    const productData = await Product.findOne({ _id: Pid })

    if (productData) {
      const SoftDelete = await Product.updateOne({ _id: Pid }, { $set: { is_deleted: 1 } })
      console.log(SoftDelete);
      if (SoftDelete) {
        console.log('updated success fully')
        res.redirect('/admin/ProductManagement')
      }
      else {
        console.log("updation is failed");
      }
    }
    else {
      res.status(404).json({ error: 'Product is not found' })

    }


  }
  catch (error) {
    res.redirect('/500')
    console.log(error.message)
  }
}

// upload cropped image----------------

const uploadCroppedImg = async (req, res) => {
  try {
    const {id,index}=req.body
    const imageArray=req.files
   
    // Process the uploaded images, filter out duplicates
    const productImages = await Promise.all(req.files.map(async (file) => {
      try {
        const resizedFilename = `resized-${file.filename}`;
        const resizedPath = path.join(__dirname, '../public/uploads', resizedFilename);

        await sharp(file.path)
          .resize({ height: 500, width: 550, fit: 'fill' })
          .toFile(resizedPath);

        return {
          filename: file.filename,
          path: file.path,
          resizedFile: resizedFilename,

        };
      } catch (error) {
        console.error('Error processing and saving image:', error);
        return null; // Exclude failed images
      }
    }))

   

    
    const existingProduct=await Product.findOne({_id:id})
    existingProduct.productImages[index]=productImages[0]
    await existingProduct.save()
  
    res.status(200).json({ message: 'File uploaded successfully' });
  }
  catch (error) {
    res.redirect('/500')
    console.log(error.message)
   
  }
}







module.exports = {
  ProductManagement,
  AddProduct,
  AddProductPage,
  listingProduct,
  editProduct,
  LoadEditProduct,
  deleteProductImage,
  deleteProduct,
  uploadCroppedImg

}