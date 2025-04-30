import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const owner = req.user._id;
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }
    const newPlaylist = await Playlist.create({ name, description, owner });
    return res
        .status(201)
        .json(
            new ApiResponse(201, newPlaylist, "Playlist created successfully")
        );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    const [result] = await Playlist.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails",
            },
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                videoCount: { $size: "$videoDetails" },
                videoDetails: 1,
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $facet: {
                metadata: [
                    { $count: "total" },
                    { $addFields: { page, limit } },
                ],
                data: [{ $skip: skip }, { $limit: limit }],
            },
        },
    ]);
    const playlists = result.data;
    const metadata = result.metadata[0] || { total: 0, page, limit };
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { playlists, metadata },
                "User playlists retrieved"
            )
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    const [playlist] = await Playlist.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(playlistId) },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails",
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
        {
            $unwind: {
                path: "$ownerDetails",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                videoCount: { $size: "$videoDetails" },
                videoDetails: 1,
                owner: {
                    _id: "$ownerDetails._id",
                    name: "$ownerDetails.name",
                    email: "$ownerDetails.email",
                },
            },
        },
    ]);

    if(!playlist){
        throw new ApiError(400, "Playlist doesn't exist");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist retrieved"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already in playlist");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const videoExists = playlist.videos.includes(videoId);
    if (!videoExists) {
        throw new ApiError(400, "Video is not in the playlist");
    }

    playlist.videos.pull(videoId);
    await playlist.save();

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video removed from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const deleted = await Playlist.findByIdAndDelete(playlistId);

    if (!deleted) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deleted, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const updated = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: { name, description } },
        { new: true }
    );

    if (!updated) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Playlist updated successfully"));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
