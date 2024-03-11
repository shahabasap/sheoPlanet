const User = require('../models/userModel');
const Product = require('../models/ProductModel');
const Cart = require('../models/CartModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/CouponModel');
const moment=require('moment')
const path=require('path')
const ejs=require('ejs')
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Wishlist = require('../models/wishlistModel');
const puppeteer = require('puppeteer')
const Ledger=require('../models/LedgerModel')

var instance = new Razorpay({
    key_id: 'rzp_test_5MqNo4cRcOTItk',
    key_secret: 'djjDUANiW3OP2wKc5ZebWoK7',
});
require('dotenv').config();

// Order route of user side-----------------------
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


const OrderPost = async (req, res) => {
    try {
        const payMethod = req.body.paymentMethod;
        const Address = req.body.selectedAddress;
        var Gtotal=req.body.GrandTotal;
        var Couponid=req.body.Couponid
        const CurrentDate = Date().toLocaleString()
        const CartId = req.params.id
        const UserCart = await Cart.findOne({ _id: CartId })
        const UserData= await User.findOne({email:req.session.user})
        const OrderId = generateRandomId();

        // adding the delivery address----------------------
        const DeliveryAddress = await User.findOne({ _id: UserCart.userid, 'address._id': Address }, { 'address.$': 1 })
        const ProductArray = UserCart.products
        const SelectedAddress=DeliveryAddress.address[0]




        if (!UserCart) {
            req.status(404).send("cart is not find")
        }
        else {
            const OrderFromcart = {
                userid: UserCart.userid,
                products: [...ProductArray],
                address: SelectedAddress,
                total:Gtotal ?? UserCart.grandTotal,
                payment: payMethod,
                date: CurrentDate,
                OID: OrderId,
                deliveryCharge:UserCart.deliveryCharge

            }
            
            const orderInstance = new Order(OrderFromcart);

            if (payMethod == "Razorpay") {
                const totalpriceInPaise = Math.round(orderInstance.total * 100);
                const minimumAmount = 100;
                const total = Math.max(totalpriceInPaise, minimumAmount);
                const PlaceOrder = await orderInstance.save()
                const ledgerData=await Ledger.findOne({Order_id:PlaceOrder._id})
                    if (!ledgerData) {
                        const ledgerCredit=new Ledger({
                            Order_id:PlaceOrder._id,
                            transactions:PlaceOrder.payment,
                            debit:0,
                            credit:PlaceOrder.total,
                            balance:PlaceOrder.total-0
                        
                        })
                        const LedgerDataCheck=await ledgerCredit.save()
                    }
                if (PlaceOrder) {
        
                   
                    genarateRazorpay(PlaceOrder._id, total).then((response) => {
                        res.json({ Onlinepay: response,couponId:Couponid})
                    })
                }




            }
            else if (payMethod == "cash on delivery") {
                orderInstance.paymentStatus='success'
                const OrderAdded = await orderInstance.save()
                if (OrderAdded) {
                    // Update product quantities in the product model
                    for (const product of ProductArray) {
                        await Product.updateOne(
                            { _id: product.productid },
                            { $inc: { pquantity: -product.quantity } }
                        );
                    }
                    if(Couponid !=undefined)
                    {
                        const CouponData=await Coupon.findOne({_id:Couponid})
                        if(CouponData)
                        {
                            const couponUser=await Coupon.findOne({_id:Couponid,'useduser.userid':UserData._id})
                            if(couponUser)
                            {
                                const UpdateStatus = await Coupon.updateOne(
                                    {
                                      "_id": Couponid,
                                      "useduser.userid": UserData._id // Replace YourUserId with the actual user ID
                                    },
                                    {
                                      $set: {
                                        "useduser.$.usedstatus": true
                                      }
                                    }
                                  );
                                   console.log("hiii",UpdateStatus);
                            }
                            else
                            {

                                let usedUser={
                                    userid:UserData._id,
                                    usedstatus:true
                                }
                                CouponData.useduser.push(usedUser)
                                await CouponData.save()
                            }

                        }
                       
                        
                    }

                    const ledgerData=await Ledger.findOne({Order_id:OrderAdded._id})
                    if (!ledgerData) {
                        const ledgerCredit=new Ledger({
                            Order_id:OrderAdded._id,
                            transactions:OrderAdded.payment,
                            debit:0,
                            credit:OrderAdded.total,
                            balance:OrderAdded.total-0
                        
                        })
                        const LedgerDataCheck=await ledgerCredit.save()
                    }
                    const deleteCartResult = await Cart.deleteOne({ _id: CartId });

                    if (deleteCartResult) {
                        console.log("Cart is deleted");
                        res.status(200).json({ success: true, message: "Cart is  deleted successfully" })

                    } else {
                        console.log("Cart is not deleted");
                        return res.status(500).json({ success: false, message: "Failed to delete the cart" });
                    }
                } else {
                    return res.status(500).json({ success: false, message: "Failed to place order" });
                }



            }
            else if (payMethod == "wallet") {
                if (UserCart.grandTotal <= UserData.walletAmount) {
                    orderInstance.paymentStatus='success'
                    const OrderAdded = await orderInstance.save();   
                    
            
                    const walletData = {
                        amount: Gtotal ?? UserCart.grandTotal,
                        message: "Product purchased using wallet",
                        transaction: '-'
                    };
            
                    UserData.wallet_history.push(walletData);
                    UserData.walletAmount -= Gtotal ?? UserCart.grandTotal;
            
                    // Save the updated user data
                    await UserData.save();
                    if(Couponid !=undefined)
                    {
                        const CouponData=await Coupon.findOne({_id:Couponid})
                        if(CouponData)
                        {
                            const couponUser=await Coupon.findOne({_id:Couponid,'useduser.userid':UserData._id})
                            if(couponUser)
                            {
                                const UpdateStatus = await Coupon.updateOne(
                                    {
                                      "_id": Couponid,
                                      "useduser.userid": UserData._id // Replace YourUserId with the actual user ID
                                    },
                                    {
                                      $set: {
                                        "useduser.$.usedstatus": true
                                      }
                                    }
                                  );
                                   console.log("hiii",UpdateStatus);
                            }
                            else
                            {

                                let usedUser={
                                    userid:UserData._id,
                                    usedstatus:true
                                }
                                CouponData.useduser.push(usedUser)
                                await CouponData.save()
                            }

                        }
                       
                        
                    }
                    const ledgerData=await Ledger.findOne({Order_id:OrderAdded._id})
                    if (!ledgerData) {
                        const ledgerCredit=new Ledger({
                            Order_id:OrderAdded._id,
                            transactions:OrderAdded.payment,
                            debit:0,
                            credit:OrderAdded.total,
                            balance:OrderAdded.total-0
                        
                        })
                        const LedgerDataCheck=await ledgerCredit.save()
                      
                       
                    }
                    const deleteCartResult = await Cart.deleteOne({ _id: CartId });

                    if (deleteCartResult) {
                        res.status(200).json({ wallet: true, message: "Cart is  deleted successfully" })

                    } else {
                        return res.status(500).json({ success: false, message: "Failed to delete the cart" });
                    }
                } 
                else
                {
                    return res.json({wallet:false,message:"insufficient fund in wallet"})
                }
                }
            
            



        }

}

     catch (error) {
        res.redirect('/500')
        console.log(error.message);
    }
}

// Order Cancelltion------------------------------

const OrderCancel = async (req, res) => {
    try {
        const OrderId = req.params.id
        const ReasonForCancellation = req.body.reason
        const CurretDate = Date().toLocaleString()
        const userData=await User.findOne({email:req.session.user})
        const Is_Order = await Order.findOne({ _id: OrderId })
        const ProductArray = Is_Order.products

        if (!Is_Order) {
            res.status(404).send("Order is  not found")
        }
        else {
            // Update product quantities in the product model
            for (const product of ProductArray) {
                await Product.updateOne(
                    { _id: product.productid },
                    { $inc: { pquantity: product.quantity } }
                );
            }


            const CancelOrder = await Order.updateOne({ _id: OrderId }, {
                $set: {
                    status: 'Cancel Order',
                    Reason: ReasonForCancellation,
                    CancelDate: CurretDate
                }
            })

            if (CancelOrder) {
                if(Is_Order.payment=='Razorpay' || Is_Order.payment=='wallet' || Is_Order.payment=='cash on delivery')
                {
                    walletData={
                        amount:Is_Order.total,
                        message:"Cancel Order Refund",

                    }
                    userData.walletAmount+=Is_Order.total
                    userData.wallet_history.push(walletData)
                    
                    await userData.save()
                    
                }

                const LedgerUpdation=await Ledger.updateOne({Order_id:OrderId},{
                    $set:{
                        debit:Is_Order.total,
                        balance:0
                        

                    }
                })

                res.json({ message: "Order Cancelled successfully" });
            }
            else {
                res.json({ message: "Order is not cancelled " });
            }
        }



    } catch (error) {
        res.redirect('/500')
        console.log(error.message);
    }
}


// Order Success------------------
const OrderSuccess = async (req, res) => {
    try {

        res.render('OrderPlaced')

    } catch (error) {
        res.redirect('/500')
        console.log(error.message);
    }
}

// order Failed------------------
const orderFailed = async (req, res) => {
    try {
        const{id}=req.params

        res.render('OrderFailed',{id})

    } catch (error) {
        res.redirect('/500')
        console.log(error.message);
    }
}

// Verify Paymnet--------------------------
const VerifyPayment = async (req, res) => {
        try {
            const payment = req.body.payment
            const OrderData = req.body.order
            const Couponid=req.body.CouponId

            const UserData = await User.findOne({ email: req.session.user })
            const userId = UserData._id
            let hmac = crypto.createHmac('sha256', 'djjDUANiW3OP2wKc5ZebWoK7')
            hmac.update(payment.razorpay_order_id + '|' + payment.razorpay_payment_id)
            hmac = hmac.digest('hex')
            if (hmac == payment.razorpay_signature) {
                const UserOrder = await Order.findOne({ _id: OrderData.receipt })
                if (UserOrder) {
                    UserOrder.paymentStatus = "success"
                    await UserOrder.save()
                }
                // update coupon status-------------------------------------
                if(Couponid !=undefined)
                    {
                        console.log("status codition is  checking");
                        const CouponData=await Coupon.findOne({_id:Couponid})
                        if(CouponData)
                        {
                            const couponUser=await Coupon.findOne({_id:Couponid,'useduser.userid':UserData._id})
                            if(couponUser)
                            {
                                const UpdateStatus = await Coupon.updateOne(
                                    {
                                      "_id": Couponid,
                                      "useduser.userid": UserData._id // Replace YourUserId with the actual user ID
                                    },
                                    {
                                      $set: {
                                        "useduser.$.usedstatus": true
                                      }
                                    }
                                  );
                                   console.log("hiii",UpdateStatus);
                            }
                            else
                            {

                                let usedUser={
                                    userid:UserData._id,
                                    usedstatus:true
                                }
                                CouponData.useduser.push(usedUser)
                                await CouponData.save()
                            }

                        }
                       
                        
                    }
                const cart = await Cart.findOne({ userid: userId });
                if (cart && cart.products && cart.products.length > 0) {
                    for (let i = 0; i < cart.products.length; i++) {
                        const productId = cart.products[i].productid;
                        const count = cart.products[i].quantity;

                        await Product.updateOne(
                            { _id: productId },
                            {
                                $inc: {
                                    pquantity: -count
                                }
                            }
                        );
                    }
                    await Cart.deleteOne({ userid: userId }).then(() => {
                    })

                    res.json({ payment: true });
                }
            }
            

        } catch (error) {
           
            console.error('Error:', error);
            res.status(500).json({ payment: false, message: "Internal Server Error" });
            res.redirect('/500')
        }
    }

    // payment failur--------------------------------
    const failedRazorPayment = async (req, res) => {
        try {
          // console.log("body::>", req.body);
          const userData=await User.findOne({email:req.session.user})
          const UserId=userData._id
          const razorpay_payment_id = req.body.payment.error.metadata.payment_id;
          const razorpay_order_id = req.body.payment.error.metadata.order_id;
          const receiptID = req.body.order.receipt;
            const update = await Order.updateOne(
                { _id: receiptID },
                {
                    $set: {
                        paymentStatus: "Pending",
                        paymentId: razorpay_payment_id,
                        razorpayOrderId: razorpay_order_id,
                    },
                },
                { upsert: true } 
            );
            const cart = await Cart.findOne({ userid: UserId });
            if (cart && cart.products && cart.products.length > 0) {
                for (let i = 0; i < cart.products.length; i++) {
                    const productId = cart.products[i].productid;
                    const count = cart.products[i].quantity;

                    await Product.updateOne(
                        { _id: productId },
                        {
                            $inc: {
                                pquantity: -count
                            }
                        }
                    );
                }
                await Cart.deleteOne({ userid: UserId }).then(() => {
                    console.log("cart is deleted successfully");
                })
            }

          res.json({ razorpayFailed: true, params: receiptID });
        } catch (err) {
            res.redirect('/500')
          // res.render('')
          console.log("razorpay-error>>", err.message);
        }
      };

// generate razorpay---------------------------------
function genarateRazorpay(OrderId, Gtotal) {
    return new Promise((resolve, reject) => {
        const Options = {
            amount: Gtotal,
            currency: "INR",
            receipt: OrderId,

        }
        instance.orders.create(Options, function (err, Order) {
            if (err) {
                reject(err);
            }
            else {
                resolve(Order)
            }

        })
    })
}

// Retry payment--------------------------
//retryRazorPayment
const retryRazorPayment = async (req, res) => {
    try {
      const orderId = req.body.orderId;
  
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }
      const razorpay_payment_id = order.paymentId;
  

  
      const subTotal = order.total_amount;
      const paymentDetails = await instance.payments.fetch(razorpay_payment_id);
    //   console.log("retry payment get");
      res.status(200).json({ paymentDetails: paymentDetails, order: orderId });
    } catch (err) {
      console.log("error", err.message);
      res.status(500).json({ error: "Internal server error." });
    }
  };
// verify payment-----------------------------

const retryVerifyPayment = async (req, res) => {
    try {
        const payment = req.body.payment
        const OrderData = req.body.ID

        const UserData = await User.findOne({ email: req.session.user })
        const userId = UserData._id
        let hmac = crypto.createHmac('sha256', 'djjDUANiW3OP2wKc5ZebWoK7')
        hmac.update(payment.razorpay_order_id + '|' + payment.razorpay_payment_id)
        hmac = hmac.digest('hex')
        if (hmac == payment.razorpay_signature) {
            const UserOrder = await Order.findOne({ _id: OrderData })
            console.log("user data",UserOrder)
            if (UserOrder) {
                UserOrder.paymentStatus = "success"
                await UserOrder.save()
            }
            
            

                res.json({ payment: true });
            }
        
        

    } catch (error) {
       
        console.error('Error:', error);
        res.status(500).json({ payment: false, message: "Internal Server Error" });
        res.redirect('/500')
    }
}
  

// Order details------------------------------------------

const OrderDetails = async (req, res) => {
    try {
      const userData=await User.findOne({email:req.session.user})
      const OrderData=await Order.findOne({userid:userData._id})
      console.log("skdf",Order);
       res.render('OrderDetails',{OrderData})
    }
    catch (error) {
        res.redirect('/500')
      console.log(error.message)
    }
  
}
// Individual order details--------------------------------------
const IndividualOrderDetails = async (req, res) => {
    try {
      const {id}=req.params
      const OrderDetails=await Order.findOne({_id:id})
      if (OrderDetails) {
        res.render('OrderDetails',{OrderDetails,moment})
      } else {
        console.log("id is not found");
      }
    }
    catch (error) {
        res.redirect('/500')
      console.log(error.message)
    }
  
}


// Return Order--------------------

const ReturnOrder = async (req, res) => {
    try {
        console.log("Entering to page");
        const OrderId = req.params.id;
        const ReasonForReturn = req.body.reason;
         console.log("passing value",OrderId,ReasonForReturn);
        // Validation
        if (!OrderId || !ReasonForReturn) {
            console.log("not valied data");
            return res.status(400).json({ success: false, message: "Invalid input data" });
        }

        const userData = await User.findOne({ email: req.session.user });
        const isOrder = await Order.findOne({ _id: OrderId });

        if (!isOrder) {
            console.log("no such order");
            return res.status(404).json({ success: false, message: "Order not found" });
        }

         console.log("updation is started");
        const returnOrderRequest = await Order.updateOne(
            { _id: OrderId },
            {
                $set: {
                    status: 'Return Request',
                    ReturnReason: ReasonForReturn,
                    ReturnDate: new Date()
                }
            }
        );

        if (returnOrderRequest) {
            console.log("Updated from page");

            return res.json({ success: true, message: "Return order is updated successfully" });
        } else {
            console.log("not updated");
            return res.json({ success: false, message: "Sorry, the order can't be returned now" });
        }
    } catch (error) {

        console.error(error.message);
        res.redirect('/500')

    }
};


//loadinvoice

const loadInvoice = async (req, res) => {
    try {
      const orderId = req.params.id; // Use req.params for URL parameters
      const UserData=await User.findOne({email:req.session.user})  
      
      
      const orderData = await Order.findById(orderId).populate({
        path: 'products.productid',
        model: "product"
      });
   
      
  
      const sumTotal = orderData.products.reduce((total, item) => total + item.price * item.quantity, 0);
      const date = new Date();
      const data = {
        order: orderData,
        user: UserData,
        
        date,
        sumTotal,
        moment
      };

      console.log("sum",sumTotal);

  
      // Render the EJS template
      const ejsTemplate = path.resolve(__dirname, '../views/users/UserPages/invoice.ejs');
      const ejsData = await ejs.renderFile(ejsTemplate, data);
  
      // Launch Puppeteer and generate PDF
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(ejsData, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  
      // Close the browser
      await browser.close();
  
      // Set headers for inline display in the browser
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename=order_invoice.pdf'
      }).send(pdfBuffer);
  
    } catch (error) {
        console.log(error);
        res.redirect('/500')
    
    }
  };
  




module.exports = {
    OrderPost,
    OrderCancel,
    OrderSuccess,
    VerifyPayment,
    OrderDetails,
    ReturnOrder,
    loadInvoice,
    failedRazorPayment,
    orderFailed,
    IndividualOrderDetails,
    retryRazorPayment,
    retryVerifyPayment
    
    
}