const mongoose = require('mongoose')

const order = new mongoose.Schema({

    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    products: [{
        productid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true

        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true

        },
        ActualPrice: {
            type: Number,
            required: true

        },
        quantity: {
            type: Number,
            required: true
        },
        totalprice: {
            type: Number,
            required: true
        },
        image: {
            type: String,
            required: true

        },
        


    }],
    address: {
        type: Object,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    payment: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Placed'
    },
    date: {
        type: Date,
        required: true
    },
    CancelDate: {
        type: Date,
        required: false
    },
    ReturnDate: {
        type: Date,
        required: false
    }
    ,
    OID: {
        type: String,
        required: true
    }
    ,
    Reason: {
        type: String,
        required: false
    },
    ReturnReason: {
        type: String,
        required: false
    },
    paymentStatus:
    {
        type: String,
        default: "Pending"
    },
    deliveryCharge:{
        type:Number,
        default:0
       },
       paymentId: String,
       razorpayOrderId: String,
    //  paymentId:{
    //     type:String,
    //     required:false
        
    //    },
    //  razorpaOrderId:{
    //     type:String,
    //     required:false
        
    //    }

})

module.exports = mongoose.model('Order', order)