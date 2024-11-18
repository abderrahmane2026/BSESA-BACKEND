import { Router } from "express";
import {
  CreateVideo,
  GetAllVideos,
  GetVideo,
} from "../controllers/VideoController.js";
import { upload, uploadLargeFile } from "../middleware/multerConfig.js";
import { checkVideoAccess } from "../middleware/CoursesProtection.js";

const VideoRouter = Router();

VideoRouter.post(
  "/video/create",
  upload.single("thumbnail"),
  uploadLargeFile.single("video"),
  CreateVideo
);
VideoRouter.get("/videos", GetAllVideos);
VideoRouter.get("/get_video", checkVideoAccess, GetVideo);

export default VideoRouter;