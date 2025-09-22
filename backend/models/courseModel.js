// models/courseModel.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  courseID: {
    type: String,
    required: true,
    unique: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  altTitles: {
    type: [String],
    default: [],
  },

  // Thumbnail for the course (from Supabase)
  thumbnail: {
    type: String, // Supabase URL or path
    default: "",
  },

  description: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    required: true,
    default: "Agriculture",
  },

  tags: {
    type: [String],
    default: [],
  },

  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: "Beginner",
  },

  // ====== Learning materials ======
  videoTutorials: {
    type: [
      {
        name: { type: String, required: true },      // video title
        url: { type: String, required: true },       // Supabase URL/path
        thumbnail: { type: String, required: true }, // video thumbnail URL/path
      },
    ],
    default: [],
  },

  pdfLessons: {
    type: [
      {
        name: { type: String, required: true }, // PDF name
        url: { type: String, required: true },  // Supabase URL/path
      },
    ],
    default: [],
  },

  textLessons: {
    type: [
      {
        name: { type: String, required: true },    // Lesson name
        content: { type: String, required: true }, // plain text / markdown
      },
    ],
    default: [],
  },

  // ===== Status flags (like your isAvilable) =====
  isPublished: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  // ===== Added for DATE & SEARCH =====
  publishedAt: {
    type: Date,               // set this when you publish
  },
  language: {
    type: String,             // for filter: "en", "si", "ta", etc.
    default: "en",
  },
  subCategory: {
    type: String,             // optional finer filter e.g. "Irrigation > Drip"
    default: "",
  },
  searchKeywords: {
    type: [String],           // extra terms to boost search (synonyms, crops, tools)
    default: [],
  },
}, { timestamps: true });     // <-- auto adds createdAt, updatedAt

// ===== Text index for search across key fields =====
courseSchema.index({
  courseName: "text",
  description: "text",
  tags: "text",
  altTitles: "text",
  searchKeywords: "text",
});

// Useful filter/sort indexes (optional but fast)
courseSchema.index({ category: 1, subCategory: 1, level: 1, language: 1, isPublished: 1 });
courseSchema.index({ publishedAt: -1 }); // newest published first

const Course = mongoose.model("courses", courseSchema);

export default Course;
