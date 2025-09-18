import Course from "../models/courseModel.js";

// ================= CREATE COURSE =================
export async function createCourse(req, res) {
  const course = new Course(req.body);

  try {
    const response = await course.save();
    res.json({
      message: "Course created successfully",
      course: response,
    });
  } catch (error) {
    console.error("Course creation failed", error);
    res.status(500).json({
      message: "Course creation failed",
      error: error.message,
    });
  }
}

// ================= GET ALL COURSES =================
export async function getCourses(req, res) {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses", error);
    res.status(400).json({
      message: "Failed to fetch courses",
      error: error.message,
    });
  }
}

// ================= GET COURSE INFO =================
export async function getCourseInfo(req, res) {
  try {
    const courseID = req.params.courseID;
    const course = await Course.findOne({ courseID: courseID });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error fetching course info", error);
    res.status(500).json({ message: "Error fetching course", error: error.message });
  }
}

// ================= UPDATE COURSE =================
export async function updateCourse(req, res) {
  const courseID = req.params.courseID;
  const data = req.body;

  try {
    const updated = await Course.updateOne({ courseID: courseID }, data);

    if (updated.matchedCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({
      message: "Course updated successfully",
    });
  } catch (error) {
    console.error("Course update failed", error);
    res.status(500).json({
      message: "Course update unsuccessful",
      error: error.message,
    });
  }
}

// ================= DELETE COURSE =================
export async function deleteCourse(req, res) {
  const courseID = req.params.courseID;

  try {
    const deleted = await Course.deleteOne({ courseID: courseID });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Course deletion failed", error);
    res.status(500).json({
      message: "Failed to delete course",
      error: error.message,
    });
  }
}
