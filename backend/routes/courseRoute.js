// routes/courseRoutes.js
import { Router } from "express";
import {
  createCourse,
  getCourses,
  getCourseInfo,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";

const courserouter = Router();

// Create
courserouter.post("/", createCourse);

// Get all
courserouter.get("/", getCourses);

// Get one
courserouter.get("/:courseID", getCourseInfo);

// Update
courserouter.patch("/:courseID", updateCourse);

// Delete
courserouter.delete("/:courseID", deleteCourse);

export default courserouter;
