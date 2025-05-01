import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const subscriberId = req.user?._id;
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (subscriberId.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const existingSub = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    if (existingSub) {
        await existingSub.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Unsubscribed from channel"));
    } else {
        await Subscription.create({
            subscriber: subscriberId,
            channel: channelId,
        });
        return res
            .status(201)
            .json(new ApiResponse(201, null, "Subscribed to channel"));
    }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    console.log("channelId param:", channelId);


    if (!isValidObjectId(channelId)){

        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.aggregate([
        { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
            },
        },
        { $unwind: "$subscriberDetails" },
        {
            $project: {
                _id: 0,
                subscriberId: "$subscriberDetails._id",
                name: "$subscriberDetails.name",
                email: "$subscriberDetails.email",
                avatar: "$subscriberDetails.avatar",
                subscribedAt: "$createdAt",
            },
        },
        { $sort: { subscribedAt: -1 } },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers,
                "Subscribers fetched successfully"
            )
        );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    console.log("subscriberId param:", subscriberId);
    if (!isValidObjectId(subscriberId))
        throw new ApiError(400, "Invalid subscriber ID");

    const subscriptions = await Subscription.aggregate([
        { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
            },
        },
        { $unwind: "$channelDetails" },
        {
            $project: {
                _id: 0,
                channelId: "$channelDetails._id",
                name: "$channelDetails.name",
                email: "$channelDetails.email",
                avatar: "$channelDetails.avatar",
                subscribedAt: "$createdAt",
            },
        },
        { $sort: { subscribedAt: -1 } },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscriptions,
                "Subscribed channels fetched successfully"
            )
        );
});


export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
