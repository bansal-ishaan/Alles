import { Router } from "express";
import {
    getdisLikedVideos,
    toggleCommentdisLike,
    toggleVideodisLike,
    toggleTweetdisLike,
} from "../controllers/dislike.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideodisLike);
router.route("/toggle/c/:commentId").post(toggleCommentdisLike);
router.route("/toggle/t/:tweetId").post(toggleTweetdisLike);
router.route("/videos").get(getdisLikedVideos);

export default router;