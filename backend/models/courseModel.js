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

    // Tutorials / Resources
    videoTutorials: {
      type: [String], // store Supabase video URLs
      default: [],
    },
    textLessons: {
      type: [String], // store plain text or markdown lesson content
      default: [],
    },
    pdfResources: {
      type: [
        {
          fileName: { type: String, required: true }, // display name
          url: { type: String, required: true }, // Supabase public URL
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // reference to Admin user
      required: true,
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
