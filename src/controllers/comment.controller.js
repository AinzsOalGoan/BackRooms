import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.models.js";
import mongoose from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    console.log("Page:", page, "Limit:", limit);

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const result = await Comment.aggregate([
        {
            $match: {
                video: mongoose.Types.ObjectId.createFromHexString(videoId), //alternate for new
            },
        },
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
                owner: {
                    _id: "$ownerDetails._id",
                    username: "$ownerDetails.username",
                    avatar: "$ownerDetails.avatar",
                },
            },
        },
    ]).facet({
        data: [{ $skip: (page - 1) * limit }, { $limit: parseInt(limit) }],
        totalCount: [{ $count: "count" }],
    });
    const comments = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;
    console.log("Total Comments:", total); // Check total count
    res.status(200).json(new ApiResponse(200, { comments, total }));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    if (!content || !videoId) {
        throw new ApiError(400, "Content and video ID are required");
    }
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,
    });

    res.status(201).json(
        new ApiResponse(201, comment, "Comment added successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required to update the comment");
    }

    const comment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user._id },
        { content, updatedAt: new Date() },
        { new: true }
    );

    if (!comment) {
        throw new ApiError(404, "Comment not found or not authorized");
    }

    res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id,
    });

    if (!comment) {
        throw new ApiError(404, "Comment not found or not authorized");
    }

    res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };
