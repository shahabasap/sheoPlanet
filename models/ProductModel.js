const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    pname:
    {
        type: String,
        required: true
    },
    pcolor:
    {
        type: String,
        required: true
    },
    psize:
    {
        type: Number,
        required: true
    },
    pgender:
    {
        type: String,
        required: true
    },
    pprice:
    {
        type: Number,
        required: true
    },
    offerprice:
    {
        type: Number,
        required: true
    },

    pquantity:
    {
        type: Number,
        required: true
    },

    pcategory:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true
    },
    pdescription:
    {
        type: String,
        required: true
    },

    productImages:
        [{
            filename: {
                type: String,
                required: true,
            },
            path: {
                type: String,
                required: true,
            },
            resizedFile: {
                type: String,
                required: true,
            },

        }]
    ,

    is_listed:
    {
        type: Number,
        default: 0
    }
    ,
    is_deleted:
    {
        type: Number,
        default: 0
    },
    added_date:
    {
        type: Date,
        required: true,
    }



});

module.exports = mongoose.model('product', productSchema);



