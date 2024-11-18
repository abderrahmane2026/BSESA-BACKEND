import { Router } from "express";
import {
  GetCourseById,
  GetCoursesByFilter,
  CreateCourse,
  addVideosToCourse,
} from "../controllers/CourseController.js";
import { upload } from "../middleware/multerConfig.js";

import {
  authenticateToken,
  authorizeRoles,
  getIdUser,
} from "../middleware/Auth.js";

const CourseRouter = Router();

CourseRouter.post(
  "/course/create",
  authenticateToken,
  authorizeRoles(["admin", "coach"]),
  upload.single("file"),
  CreateCourse
);
CourseRouter.put("/course/add_video/:id", addVideosToCourse);
CourseRouter.get("/courses/", getIdUser, GetCoursesByFilter);
CourseRouter.get("/course/:id", getIdUser, GetCourseById);

export default CourseRouter;
