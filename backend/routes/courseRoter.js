import express from "express";
import {
  createCourse,
  getCourses,
  getCourseInfo,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";

const courseRouter = express.Router();

courseRouter.post("/", createCourse);
courseRouter.get("/", getCourses);
courseRouter.get("/:courseID", getCourseInfo);
courseRouter.put("/:courseID", updateCourse);
courseRouter.delete("/:courseID", deleteCourse);

export default courseRouter;
