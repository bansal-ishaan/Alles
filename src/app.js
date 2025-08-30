import express, { urlencoded } from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import session from "express-session"; 
import passport from "passport";     


const app = express();

console.log("--- Starting Application ---");
console.log(`Node Environment (NODE_ENV): ${process.env.NODE_ENV}`);
console.log(`CORS Origin (CORS_ORIGIN): ${process.env.CORS_ORIGIN}`);
if (!process.env.SESSION_SECRET) {
    console.error("FATAL ERROR: SESSION_SECRET is not defined.");
}

app.set('trust proxy', 1);

import "./config/passport.config.js";

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());



const isProduction = process.env.NODE_ENV === 'production';
console.log(`Is application in production mode? ${isProduction}`);

// Define the base cookie options
const cookieOptions = {
    secure: isProduction,
    httpOnly: true,
    // SameSite must be 'lax' for local development, but 'none' for cross-site production
    sameSite: isProduction ? 'none' : 'lax'
};

console.log("Session Cookie options that will be used:", cookieOptions);
console.log("--------------------------");

// Add the domain only if in production


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: cookieOptions,
    
}));


app.use(passport.initialize());
app.use(passport.session());

//routes import

import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import videoRouter from "./routes/video.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import dislikeRouter from "./routes/dislike.routes.js"
import roomRouter from './routes/room.routes.js'; 

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/dislikes",dislikeRouter);
app.use("/api/v1/rooms", roomRouter);

export {app}