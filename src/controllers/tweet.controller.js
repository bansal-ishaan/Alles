import { asyncHandler } from "../utils/asyncHandler.js";
import { apierrors } from "../utils/apierrors.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new apierrors(400, "Content is required");
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id,
    });

    if (!tweet) {
        throw new apierrors(500, "Failed to create tweet, please try again");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;

    if (!content) {
        throw new apierrors(400, "Content is required");
    }

    if (!isValidObjectId(tweetId)) {
        throw new apierrors(400, "Invalid tweetId");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new apierrors(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new apierrors(400, "Only owner can edit their tweet");
    }

    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content } },
        { new: true }
    );

    if (!newTweet) {
        throw new apierrors(500, "Failed to edit tweet, please try again");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new apierrors(400, "Invalid tweetId");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new apierrors(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new apierrors(400, "Only owner can delete their tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
        .status(200)
        .json(new ApiResponse(200, { tweetId }, "Tweet deleted successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new apierrors(400, "Invalid userId");
    }

    const tweets = await Tweet.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [{ $project: { username: 1, "avatar.url": 1 } }],
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likeDetails",
                pipeline: [{ $project: { likedBy: 1 } }],
            },
        },
        {
            $addFields: {
                likesCount: { $size: "$likeDetails" },
                ownerDetails: { $first: "$ownerDetails" },
                isLiked: {
                    $cond: {
                        if: { $in: [new mongoose.Types.ObjectId(req.user?._id), "$likeDetails.likedBy"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                content: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

// FIXED VERSION OF getAllTweets
const getAllTweets = asyncHandler(async (req, res) => {
    // console.log(" Starting getAllTweets function...");
    
    try {
        // Check if user is authenticated and get userId
        let userId = null;
        if (req.user?._id) {
            if (typeof req.user._id === 'string' && isValidObjectId(req.user._id)) {
                userId = new mongoose.Types.ObjectId(req.user._id);
            } else if (mongoose.Types.ObjectId.isValid(req.user._id)) {
                userId = req.user._id;
            }
        }

        // console.log("User ID:", userId ? userId.toString() : "Guest user");

        // Build aggregation pipeline step by step
        const pipeline = [
  {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "ownerDetails",
      pipeline: [
        {
          $project: {
            username: 1,
            "avatar.url": 1,
            fullName: 1
          }
        }
      ],
    },
  },
  {
    $lookup: {
      from: "likes",
      localField: "_id",
      foreignField: "tweet",
      as: "likeDetails",
    },
  },
  {
    $addFields: {
      likesCount: { $size: "$likeDetails" },
      ownerDetails: { $first: "$ownerDetails" },
      ownerId: "$owner", // 👈 add raw ownerId
      isLiked: userId ? {
        $in: [userId, "$likeDetails.likedBy"]
      } : false,
    },
  },
  { $sort: { createdAt: -1 } },
  {
    $project: {
      content: 1,
      ownerDetails: 1,
      ownerId: 1, // 👈 keep it in the result
      likesCount: 1,
      createdAt: 1,
      isLiked: 1,
      updatedAt: 1,
    },
  },
];


        // console.log("Executing aggregation pipeline...");
        const tweets = await Tweet.aggregate(pipeline);

        // console.log(`Found ${tweets.length} tweets`);

        return res
            .status(200)
            .json(new ApiResponse(200, tweets, "All tweets fetched successfully"));

    } catch (error) {
        console.error("❌ Error in getAllTweets:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
        });

        // More specific error handling
        if (error.name === 'CastError') {
            throw new apierrors(400, "Invalid data format in request");
        }
        
        if (error.name === 'ValidationError') {
            throw new apierrors(400, "Data validation failed");
        }

        if (error.message.includes('connection')) {
            throw new apierrors(503, "Database connection error");
        }

        // Generic error
        throw new apierrors(500, `Failed to fetch tweets: ${error.message}`);
    }
});

export { getAllTweets, createTweet, getUserTweets, updateTweet, deleteTweet };