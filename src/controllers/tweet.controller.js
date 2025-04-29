import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/Tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = "desc",
        userId = req.user._id, // Defaults to current user if not specified
    } = req.query;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Match stage to filter tweets
    const matchStage = {
        owner: new mongoose.Types.ObjectId(userId)
    };

    if (query) {
        matchStage.content = { $regex: query, $options: "i" };
    }

    const sortStage = {};
    sortStage[sortBy] = sortType === "asc" ? 1 : -1;
    const aggregateQuery = Tweet.aggregate([
        { $match: matchStage },
        { $sort: sortStage },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
            },
        },
        { $unwind: "$ownerDetails" },
        {
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                "ownerDetails._id": 1,
                "ownerDetails.username": 1,
                "ownerDetails.avatar": 1,
            },
        },
    ]);
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };

    const result = await Tweet.aggregatePaginate(aggregateQuery, options);

    res.status(200).json(
        new ApiResponse(200, result, "Tweets fetched successfully")
    );
});

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.create({
        content,
        owner: req.user._id,
    });
    res.status(201).json(new ApiResponse(201, tweet, "Tweeted successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "Content is required to update the tweet");
    }
    const tweet = await Tweet.findOneAndUpdate(
        { _id: tweetId, owner: req.user._id },
        { content, updatedAt: new Date() },
        { new: true }
    );
    if (!tweet) {
        throw new ApiError(404, "tweet not found or not authorized");
    }

    res.status(200).json(
        new ApiResponse(200, tweet, "tweet updated successfully")
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    const tweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user._id,
    });

    if (!tweet) {
        throw new ApiError(404, "Tweet not found or not authorized");
    }

    res.status(200).json(
        new ApiResponse(200, null, "Tweet deleted successfully")
    );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
