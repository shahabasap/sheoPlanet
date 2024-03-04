const mongoose = require('mongoose')

const wishlist = new mongoose.Schema({

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
        image: {
            type: String,
            required: true

        },
        quantity:
        {
            type:Number,
            default:1
        }


    }],
    


})

module.exports = mongoose.model('Wishlist',wishlist)