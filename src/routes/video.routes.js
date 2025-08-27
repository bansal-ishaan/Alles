// src/routes/video.routes.js

import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// =================================================================
//   IMPORTANT: We REMOVE the global router.use(verifyJWT) line.
//   Instead, we add 'verifyJWT' as a middleware to each protected route individually.
// =================================================================


// --- Public and Protected Routes for '/' ---
router.route("/")
    // PUBLIC ROUTE: Anyone can see the list of public videos. No verifyJWT here.
    .get(getAllVideos) 
    
    // PROTECTED ROUTE: Only a logged-in user can publish a video.
    // The middleware chain runs in order: verifyJWT -> multer -> controller.
    .post(
        verifyJWT,
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 },
        ]),
        publishAVideo
    );

// --- Protected Routes for a Specific Video '/:videoId' ---
router.route("/:videoId")
    // PROTECTED ROUTE: Needed to check if the current user has liked/subscribed.
    .get(verifyJWT, getVideoById) 
    
    // PROTECTED ROUTE: Only the owner can delete their video.
    .delete(verifyJWT, deleteVideo) 
    
    // PROTECTED ROUTE: Only the owner can update their video.
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo);


// --- Protected Route for Toggling Publish Status ---
router.route("/toggle/publish/:videoId")
    // PROTECTED ROUTE: Only the owner can change the publish status.
    .patch(verifyJWT, togglePublishStatus);

export default router;