const mongoose = require("mongoose");

const schema = new mongoose.Schema(
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            required:true
        },
        analysis:{
            type:mongoose.Schema.Types.ObjectId,
            unique:true,
            required:true
        },
        content:{
            type:String,
            required:true
        },
        tone:{
            type:String,
            enum:['professional','friendly','confident'],
            default:'professional'
        },
        companyName:{
            type:String,
            trim:true,
            maxlength:80
        },
        hiringManager:{
            type:String,
            trim:true,
            maxlength:60
        },
        location:{
            type:String,
            trim:true,
            maxlength:80
        }
    },
    {
        timestamps:true
    }
)

const Coverletters = mongoose.model("coverletters",schema);

module.exports = Coverletters;