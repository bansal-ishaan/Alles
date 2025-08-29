import { Router } from "express";
import {
  loginUser,
  logoutuser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getWatchHistory,
  getUserChannelProfile,
  googleLoginCallback, // Keep this for the initial redirect
  finalizeGoogleLogin   // Keep this for JWT generation
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import passport from "passport";


const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

router.route("/login").post(loginUser);

// Secured routes
router.route("/logout").post(verifyJWT, logoutuser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);


// Route 1: Initiates the login flow, redirecting user to Google
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

// Route 2: Callback from Google. Passport handles the code exchange and user profile fetch.
// On success, it calls our `googleLoginCallback` controller which redirects to frontend.
router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=google-auth-failed`,
        session: true, // IMPORTANT: We need the session to be temporarily active
    }),
    googleLoginCallback // This controller now just handles the redirect.
);

// Middleware to check if user is authenticated in the session
const isSessionAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    // If not authenticated, log and send an unauthorized response
    console.log("User session not found during /google/finalize. Redirecting to login.");
    // Changed to redirect to login with an error message, as the finalize step needs an active session.
    // This assumes your frontend handles the 'error' query param on the login page.
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=google-session-expired`);
};

// Route 3: Finalization route for the frontend to call to get the JWT
// This route now uses `isSessionAuthenticated` to ensure req.user exists before proceeding.
router.get("/google/finalize", isSessionAuthenticated, finalizeGoogleLogin);


export default router;