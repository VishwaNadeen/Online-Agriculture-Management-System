import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    url:  { type: String, trim: true },
  },
  { _id: false }
);

const PdfSchema = new mongoose.Schema(
  {
    fileName: { type: String, trim: true },
    url:      { type: String, trim: true },
    name:     { type: String, trim: true },
  },
  { _id: false }
);

const TextLessonSchema = new mongoose.Schema(
  {
    name:    { type: String, trim: true },
    content: { type: String, default: "" },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    courseID:    { type: String, required: true, unique: true, trim: true },
    title:       { type: String, required: true, trim: true },
    altTitles:   { type: [String], default: [] },
    description: { type: String, required: true },
    category:    { type: String, required: true, trim: true },
    tags:        { type: [String], default: [] },
    level:       { type: String, enum: ["Beginner","Intermediate","Advanced"], default: "Beginner" },

    videoTutorials: { type: [VideoSchema], default: [] },
    textLessons:    { type: [TextLessonSchema], default: [] },
    pdfResources:   { type: [PdfSchema], default: [] },

    isPublished: { type: Boolean, default: true },

    // keep as String if you send a plain ID from the UI; switch to ObjectId if you want strict refs
    createdBy: { type: String, trim: true },
  },
  {
    timestamps: true,
    collection: "courses", // <-- pins collection name explicitly
  }
);

const Course = mongoose.model("Course", courseSchema); // <-- singular model name
export default Course;
