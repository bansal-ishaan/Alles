import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    deleteTweet,
    updateTweet,
    getUserTweets,
    getAllTweets
} from "../controllers/tweet.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT, upload.none()); // Apply verifyJWT middleware to all routes in this file
router.route("/").post(createTweet);
router.route("/all").get(getAllTweets);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").put(updateTweet).delete(deleteTweet);

export default router;