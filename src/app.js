import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
// Before cors middleware
import dotenv from "dotenv";
dotenv.config();


const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());


//routes import
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import likeRouter from "./routes/like.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import subcriptionRouter from "./routes/subscription.routes.js"

//routes declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/video",videoRouter)
app.use("/api/v1/comment",commentRouter)
app.use("/api/v1/tweet",tweetRouter)
app.use("/api/v1/like",likeRouter)
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/subcription", subcriptionRouter);

export { app };
