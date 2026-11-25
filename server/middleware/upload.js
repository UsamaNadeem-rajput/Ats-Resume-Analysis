const multer = require("multer");
const AppError = require("../utils/AppError");

const storage= multer.memoryStorage();
const limit = {fileSize: 1024*1024*5};
const filefilter = (req,file,cb)=>{
    if(file.mimetype === "application/pdf"){
        cb(null,true)
    }else{
        cb(new AppError('Only PDF files are allowed', 400, 'VALIDATION_ERROR'),false)
    }
}

const upload= multer({
    storage:storage,
    limits:limit,
    fileFilter:filefilter
})

module.exports=upload;