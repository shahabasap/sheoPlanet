const mongoose=require("mongoose")
const bannerSchema=mongoose.Schema({

    image:{
        type:String,
        required:true
    },
    Url:{
       type:String,
       require:true
    }
    ,
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },

    is_listed: {
       type: Number,
        default: 0,
      }
})
const Banner=mongoose.model('banner',bannerSchema)
module.exports=Banner