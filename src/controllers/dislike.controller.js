import mongoose, { isValidObjectId } from "mongoose";
import { disLike } from "../models/dislike.model.js";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { apierrors } from "../utils/apierrors.js";

const toggleVideodisLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new apierrors(400, "Invalid videoId");
    }

    const dislikedAlready = await disLike.findOne({
        video: videoId,
        dislikedBy: req.user?._id,
    });

    if (dislikedAlready) {
        await disLike.findByIdAndDelete(dislikedAlready?._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isdisLiked: false }));
    }

    // Remove like if it exists (mutual exclusivity)
    await Like.findOneAndDelete({
        video: videoId,
        likedBy: req.user?._id,
    });

    await disLike.create({
        video: videoId,
        dislikedBy: req.user?._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isdisLiked: true }));
});

const toggleCommentdisLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new apierrors(400, "Invalid commentId");
    }


    const dislikedAlready = await disLike.findOne({
        comment: commentId,
        dislikedBy: req.user?._id,
    });

    if (dislikedAlready) {
        await disLike.findByIdAndDelete(dislikedAlready?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, { isdisLiked: false }));
    }

    await disLike.create({
        comment: commentId,
        dislikedBy: req.user?._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isdisLiked: true }));
});

const toggleTweetdisLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new apierrors(400, "Invalid tweetId");
    }


    const dislikedAlready = await disLike.findOne({
        tweet: tweetId,
        dislikedBy: req.user?._id,
    });

    if (dislikedAlready) {
        await disLike.findByIdAndDelete(dislikedAlready?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, { tweetId, isdisLiked: false }));
    }

    await disLike.create({
        tweet: tweetId,
        dislikedBy: req.user?._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isdisLiked: true }));
});

const getdisLikedVideos = asyncHandler(async (req, res) => {
    const dislikedVideosAggregate = await disLike.aggregate([
        {
            $match: {
                dislikedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "dislikedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        },
                    },
                    {
                        $unwind: "$ownerDetails",
                    },
                ],
            },
        },
        {
            $unwind: "$dislikedVideo",
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                _id: 0,
                dislikedVideo: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    },
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                dislikedVideosAggregate,
                "disliked videos fetched successfully"
            )
        );
});

export { toggleVideodisLike, toggleCommentdisLike, toggleTweetdisLike, getdisLikedVideos };