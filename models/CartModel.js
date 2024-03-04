const mongoose = require('mongoose')

const cart = new mongoose.Schema({

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
        quantity: {
            type: Number,
            required: true
        },
        ActualPrice: {
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

    deliveryCharge:{
     type:Number,
     default:0
    },

    grandTotal: {
        type: Number,
        required: true
    }


})

module.exports = mongoose.model('Cart', cart)