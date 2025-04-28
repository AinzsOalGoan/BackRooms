import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/coudinary.js";
import { Video } from "../models/video.models.js";
import mongoose from "mongoose";
import { formatDuration } from "../utils/formatDuration.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    /**
     * 1. show case all of the video of the user has
     * 2. show the title, file link
     */
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
    const vid = await video.findById(videoId);
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
    /*
    1.get the video id by searching it for the user by videoId
    2.update the video link,title,description,duration
    3.check if the views are same or not 
    4.save it to mongoDB
    */
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    /*
    1.get the video id by searching it for the user by videoId
    2.delete the video
    3.save it to mongoDB
    */
});
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
