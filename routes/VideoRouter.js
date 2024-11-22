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
  uploadLargeFile.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  CreateVideo
);
VideoRouter.get("/videos", GetAllVideos);
VideoRouter.get("/get_video", checkVideoAccess, GetVideo);

export default VideoRouter;
