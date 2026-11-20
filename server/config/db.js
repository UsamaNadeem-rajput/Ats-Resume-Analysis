const mongo = require("mongoose");
const dotenv=require("dotenv");
dotenv.config();

const connect = ()=>{
    mongo.connect(process.env.Mongourl)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log(err))

}

module.exports = connect;