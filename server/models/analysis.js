const mongoose = require("mongoose");
const mongoosepagination = require("mongoose-paginate-v2")

const sectionSuggestionSchema = new mongoose.Schema(
  {
    section: { type: String, required: true, trim: true },
    issue: { type: String, required: true, trim: true },
    fix: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const rewrittenBulletSchema = new mongoose.Schema(
  {
    before: { type: String, required: true, trim: true },
    after: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const schema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    resume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "resumes", // Populate ke liye ref add kiya
        required: true
    },
    jobTitle: {
        type: String,
    },
    jobDescription: {
        type: String,
        minlength: 100,
        maxlength: 8000,
        required: true
    },
    score: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    breakdown: {
      keywordMatch: { type: Number, required: true, min: 0, max: 20 },
      skillsMatch: { type: Number, required: true, min: 0, max: 40 },
      sectionCompleteness: { type: Number, required: true, min: 0, max: 15 },
      formatting: { type: Number, required: true, min: 0, max: 10 },
      achievements: { type: Number, required: true, min: 0, max: 10 },
      readability: { type: Number, required: true, min: 0, max: 5 },
    },
    matchedkeywords: {
        type: [String],
        default: []
    },
    missingkeywords: {
        type: [String],
        default: []
    },
    matchedSkills: {
        type: [String],
        default: []
    },
    missingSkills: {
        type: [String],
        default: []
    },
    suggestions: {
        summary: { type: String, trim: true },
        sectionSuggestions: { type: [sectionSuggestionSchema], default: [] },
        rewrittenBullets: { type: [rewrittenBulletSchema], default: [] },
    },
    aiStatus: {
      type: String,
      enum: ['not_requested', 'ok', 'failed'], // 'not_requested' shamil kiya
      default: 'not_requested',               // Ab shuru mein AI run nahi hoga
      required: true,
    },
},
{
    timestamps: true,
});

schema.plugin(mongoosepagination)

const Analysis = mongoose.model("analysis", schema);

module.exports = Analysis;