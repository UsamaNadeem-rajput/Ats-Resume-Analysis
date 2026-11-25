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
    },
    sizeBytes: {
        type: Number,
    },
    pageCount: {
        type: Number,
        default: 1
    },
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

schema.index({ user: 1, fileHash: 1 }, { unique: true });

const Resume = mongoose.model("resumes", schema);

module.exports = Resume;