const mongoose = require('mongoose')
const CategorySchema = new mongoose.Schema({
    Cname:
    {
        type: String,
        required: true
    },
    Cdescription:
    {
        type: String,
        required: true
    },
    is_listed:
    {
        type: String,
        default: 0
    }
});



module.exports = mongoose.model('category', CategorySchema)



