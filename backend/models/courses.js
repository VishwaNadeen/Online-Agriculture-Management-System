import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    courseID: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        default: "General"
    },
    description: {
        type: String,
        required: true
    },
    coverImage: {
        type: String, // Supabase URL 
        default: ""
    },
    videoTutorials: {
        type: [String], // store Supabase URLs 
        default: []
    },
    pdfMaterials: {
        type: [String], // store Supabase URLs 
        default: []
    },
    textLessons: {
        type: [String], // plain text or markdown lessons
        default: []
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Course = mongoose.model("courses", courseSchema);

export default Course;
