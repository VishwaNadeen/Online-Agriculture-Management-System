import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    courseID: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    altTitles: {
      type: [String], // alternative names for searching/filter
      default: [],
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String, // e.g. "Organic Farming", "Pest Control", "Irrigation"
      required: true,
    },
    tags: {
      type: [String], // for searching/filtering (ex: "rice", "wheat", "fertilizer")
      default: [],
    },
    level: {
      type: String, // Beginner, Intermediate, Advanced
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    // Tutorials / Resources (modified to support names)
    videoTutorials: {
      type: [
        {
          name: { type: String }, // display name for the video
          url: { type: String },  // Supabase video URL
        },
      ],
      default: [],
    },
    textLessons: {
      type: [
        {
          name: { type: String },    // title for the lesson
          content: { type: String }, // plain text or markdown
        },
      ],
      default: [],
    },
    pdfResources: {
      type: [
        {
          fileName: { type: String }, // original file name
          url: { type: String },      // Supabase public URL
          name: { type: String },     // custom display name
        },
      ],
      default: [],
    },

    // Meta info
    isPublished: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("courses", courseSchema);

export default Course;
