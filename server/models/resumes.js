const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    orignalName: {
        type: String,
        required: true,
    },
    fileHash: {
        type: String,
        required: true
        // (index: true yahan se hata diya: neeche compound unique index ise cover karta hai)
    },
    sizeBytes: {
        type: Number,
    },
    // BADLAO 1: re-upload par bhi page count wahi rahe (pehle dobara upload par hamesha 1 maana jata tha)
    pageCount: {
        type: Number,
        default: 1
    },
    // BADLAO 2: ab lines newline (\n) se jori hoti hain, taake headings aur naam wapas pehchane ja saken.
    // Ek-line text chahiye to controller ke partsFromSaved() se banta hai
    extractedText: {
        type: String
    },
    detectedSections: {
        type: [String],
        default: []
    }
},
{
    timestamps: true
});

// BADLAO 3: ek user ka ek hi file sirf ek baar. Do requests ek saath aayen tab bhi database
// khud duplicate rok deta hai (controller E11000 error pakad kar maujooda wala use karta hai)
schema.index({ user: 1, fileHash: 1 }, { unique: true });

const Resume = mongoose.model("resumes", schema);

module.exports = Resume;