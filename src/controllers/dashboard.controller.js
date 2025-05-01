import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId  = req.user?._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Fetch all videos of the channel
    const videos = await Video.find({ owner: channelId });

    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, video) => sum + video.views, 0);

    const videoIds = videos.map((video) => video._id);

    // Count total likes across all videos
    const totalLikes = await Like.countDocuments({
        video: { $in: videoIds },
    });

    // Count total subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalViews,
                totalLikes,
                totalSubscribers,
            },
            "Channel stats fetched successfully"
        )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const videos = await Video.find({ owner: userId })
        .sort({ createdAt: -1 })
        .select("title thumbnail views duration createdAt");

    return res
        .status(200)
        .json(
            new ApiResponse(200, videos, "Channel videos fetched successfully")
        );
});


export { getChannelStats, getChannelVideos };
