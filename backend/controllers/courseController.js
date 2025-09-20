import Course from "../models/courseModel.js";

// ================= CREATE COURSE =================
export async function createCourse(req, res) {
  try {
    const course = await Course.create(req.body);
    return res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Course creation failed:", error);
    return res.status(500).json({
      message: "Course creation failed",
      error: error.message,
    });
  }
}

// ================= GET ALL COURSES =================
export async function getCourses(req, res) {
  try {
    const courses = await Course.find().lean();
    return res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(400).json({
      message: "Failed to fetch courses",
      error: error.message,
    });
  }
}

// ================= GET COURSE INFO =================
export async function getCourseInfo(req, res) {
  try {
    const { courseID } = req.params;
    const course = await Course.findOne({ courseID }).lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.json(course);
  } catch (error) {
    console.error("Error fetching course info:", error);
    return res.status(500).json({
      message: "Error fetching course",
      error: error.message,
    });
  }
}

// ================= UPDATE COURSE =================
export async function updateCourse(req, res) {
  try {
    const { courseID } = req.params;
    const data = req.body;

    // ensure updatedAt is refreshed when using findOneAndUpdate
    const updated = await Course.findOneAndUpdate(
      { courseID },
      { $set: data, $currentDate: { updatedAt: true } },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json({
      message: "Course updated successfully",
      course: updated,
    });
  } catch (error) {
    console.error("Course update failed:", error);
    return res.status(500).json({
      message: "Course update unsuccessful",
      error: error.message,
    });
  }
}

// ================= DELETE COURSE =================
export async function deleteCourse(req, res) {
  try {
    const { courseID } = req.params;
    const deleted = await Course.deleteOne({ courseID });
    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Course deletion failed:", error);
    return res.status(500).json({
      message: "Failed to delete course",
      error: error.message,
    });
  }
}
