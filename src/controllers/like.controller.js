import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId,
    });

    if (existingLike) {
        await existingLike.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Video like removed"));
    }

    const like = await Like.create({ video: videoId, likedBy: userId });
    return res.status(201).json(new ApiResponse(201, like, "Video liked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId,
    });
    if (existingLike) {
        await existingLike.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Comment like removed"));
    }
    const like = await Like.create({ comment: commentId, likedBy: userId });
    return res.status(201).json(new ApiResponse(201, like, "Video liked"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId,
    });
    if (existingLike) {
        await existingLike.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Tweet like removed"));
    }
    const like = await Like.create({ tweet: tweetId, likedBy: userId });
    return res.status(201).json(new ApiResponse(201, like, "Tweet liked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true, $ne: null },
            },
        },
        {
            $lookup: {
                from: "videos", // Collection name in MongoDB
                localField: "video",
                foreignField: "_id",
                as: "video",
            },
        },
        {
            $unwind: "$video",
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $project: {
                _id: 0, // hide like ID
                video: 1, // return only video object
                likedAt: "$createdAt",
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched"));
});


export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
