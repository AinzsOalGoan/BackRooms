import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/coudinary.js";
import { Video } from "../models/video.models.js";
import mongoose from "mongoose";
import { formatDuration } from "../utils/formatDuration.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = "desc",
        userId,
    } = req.query;
    // 1. Build match filter for MongoDB
    const matchStage = {};

    // a) If a search query is provided, do case-insensitive match on title
    if (query) {
        matchStage.title = { $regex: query, $options: "i" };
    }

    // b) If a userId is specified (e.g., for profile page), filter by owner
    if (userId) {
        matchStage.owner = userId;
    }

    // c) Only return published videos
    matchStage.isPublished = true;

    // 2. Set sorting direction
    const sortStage = {};
    sortStage[sortBy] = sortType === "asc" ? 1 : -1;
    // 3. Aggregate query with pagination
    const aggregateQuery = Video.aggregate([
        {
            $match: matchStage,
        },
        {
            $sort: sortStage,
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $unwind: "$owner",
        },
        {
            $project: {
                title: 1,
                videoFile: 1,
                thumbnail: 1,
                views: 1,
                duration: 1,
                createdAt: 1,
                isPublished: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.email": 1,
            },
        },
    ]);
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };
    // 4. Execute paginated aggregate
    const result = await Video.aggregatePaginate(aggregateQuery, options);
    // 5. Send response
    res.status(200).json(
        new ApiResponse(200, result, "Videos fetched successfully")
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    const videoLocalPath = req.files.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files.thumbnail?.[0]?.path;

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!uploadedVideo.url || !uploadedThumbnail.url) {
        throw new ApiError(500, "Upload failed, please try again");
    }
    const formattedDuration = formatDuration(uploadedVideo.duration);

    const newVideo = await Video.create({
        title,
        description,
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        duration: formattedDuration, //duration part
        owner: req.user._id,
        views: 0,
        isPublished: true, // You are publishing it now
    });

    return res
        .status(201)
        .json(new ApiResponse(201, newVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    /*
    1. get the video id by searching it for the user by videoId
    2. check if the video exists 
    3. show the video in the response also show published or not
    --extra--
    1. based on published 
    2. show or dont show the video 
    3. if show then do the same 
    4. if not published say this vid is not published
    --could be better--
    */
    const { videoId } = req.params;
    const userId = req.user?._id;
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(404, "Invalid video Id format");
    }
    const vid = await Video.findById(videoId);
    if (!vid) {
        throw new ApiError(404, "Video does not exist");
    }
    //checking for published or owned by user
    if (!vid.isPublished && vid.owner.toString() !== userId.toString()) {
        throw new ApiError(
            403,
            "You are not allowed to view this unpublished video"
        );
    }
    return res
        .status(200)
        .json(new ApiResponse(200, vid, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const existingVid = await Video.findById(videoId);
    if (!existingVid) {
        throw new ApiError(400, "Video not found");
    }
    if (existingVid.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }
    const { title, description } = req.body;

    if (title) existingVid.title = title;
    if (description) existingVid.description = description;
    //video link updation
    if (req.files?.videoFile?.[0]) {
        const videoResult = await uploadOnCloudinary(
            req.files.videoFile[0].path
        );
        if (!videoResult?.url) {
            throw new ApiError(500, "Video upload failed");
        }
        existingVid.videoFile = videoResult.url;

        // Optional: Update duration from Cloudinary if available
        if (videoResult.duration) {
            existingVid.duration = formatDuration(videoResult.duration);
        }
    }

    //thumbnail updation
    if (req.files?.thumbnail?.[0]) {
        const thumbnailResult = await uploadOnCloudinary(
            req.files.thumbnail[0].path
        );
        if (!thumbnailResult?.url) {
            throw new ApiError(500, "Thumbnail upload failed");
        }
        existingVid.thumbnail = thumbnailResult.url;
    }

    await existingVid.save();

    res.status(200).json(
        new ApiResponse(200, existingVid, "Video updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const existingVid = await Video.findById(videoId);
    if (!existingVid) {
        throw new ApiError(400, "Video not found");
    }
    if (existingVid.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }
    await Video.findByIdAndDelete(videoId);
    //coudinary delete
    res.status(200).json(
        new ApiResponse(200, null, "Video deleted successfully")
    );
});
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const existingVid = await Video.findById(videoId);
    if (!existingVid) {
        throw new ApiError(400, "Video not found");
    }
    if (existingVid.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }
    existingVid.isPublished = !existingVid.isPublished;
    await existingVid.save();
    res.status(200).json(
        new ApiResponse(
            200,
            existingVid,
            `Video ${existingVid.isPublished ? "published" : "unpublished"} successfully`
        )
    );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
