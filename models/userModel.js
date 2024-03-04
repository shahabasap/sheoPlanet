const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    name:
    {
        type: String,
        required: true
    },
    email:
    {
        type: String,
        required: true
    },
    mobile:
    {
        type: String,
        required: true
    },
    password:
    {
        type: String,
        required: true
    },
    is_admin: {
        type: Number,
        required: true,
        default: 0, // Provide a default value
    },
    is_varified:
    {
        type: Number,
        default: 0
    },
    is_Blocked:
    {
        type: Number,
        default: 0
    },
    address: [{
        name: {
            type: String,
            required: true

        },
        buildingname: {
            type: String,
            required: true

        },
        mobile: {
            type: String,
            required: true

        },
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true
        }

    }],
    walletAmount:{
        type:Number,
        default:0
    },
    wallet_history:[{
        date:{
            type:Date,
            default: Date.now,

        },
        amount:{
            type:Number
        },
        reason:{
            type:String
        },
        message:{
            type:String,
        },
        transaction:{
            type:String,
            default:'+'
        }
    }],
    RefId:{
        type:String,
        required:false
    }
});



module.exports = mongoose.model('user', userSchema)

