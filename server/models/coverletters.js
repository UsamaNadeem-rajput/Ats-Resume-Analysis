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
        // ── NAYE FIELDS (sab optional): PDF ke header/receiver block ke liye ─────────────
        // Tumhara model waisa hi hai, sirf yeh 4 cheezein add hui hain. Mongoose unhein save hi nahi karta
        // jab tak schema mein na hon, isliye inhein model mein likhna zaroori hai
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