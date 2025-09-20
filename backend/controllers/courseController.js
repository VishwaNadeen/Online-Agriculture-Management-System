// controllers/courseController.js
import Course from "../models/courseModel.js";

/* ================= CREATE ================= */
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
    });
  }
}

/* ================= READ: ALL ================= */
export async function getCourses(req, res) {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses", error);
    res.status(400).json({
      message: "Failed to fetch courses",
    });
  }
}

/* ================= READ: ONE ================= */
export async function getCourseInfo(req, res) {
  try {
    const courseID = req.params.courseID;
    const course = await Course.findOne({ courseID });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error fetching course info", error);
    res.status(404).json({ message: "Error fetching course" });
  }
}

/* ================= UPDATE ================= */
export async function updateCourse(req, res) {
  const courseID = req.params.courseID;
  const data = req.body;
  data.courseID = courseID; // keep consistent

  try {
    await Course.updateOne({ courseID }, data);

    res.json({
      message: "Course updated successfully",
    });
  } catch (error) {
    console.error("Course update failed", error);
    res.status(500).json({
      message: "Course update unsuccessful",
    });
  }
}

/* ================= DELETE ================= */
export async function deleteCourse(req, res) {
  try {
    const courseID = req.params.courseID;

    await Course.deleteOne({ courseID });

    res.json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Course delete failed", error);
    res.status(500).json({
      message: "Failed to delete course",
    });
  }
}
