import {asyncHandler} from "../utils/asyncHandler.js";
import { apierrors } from "../utils/apierrors.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import {
    uploadOnCloudinary,
    deleteOnCloudinary
} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { disLike } from "../models/dislike.model.js";




const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const pipeline = [];

    // --- Stage 1: Text Search (Optional) ---
    // If a search query is provided, this stage runs first to filter by text.
    if (query) {
        pipeline.push({
            $search: {
                index: "search-videos", // Make sure this index exists in your MongoDB Atlas cluster
                text: {
                    query: query,
                    path: ["title", "description"],
                },
            },
        });
    }

    // --- Stage 2: Content Filtering ---
    // This is the main filter. It's now robust.
    if (userId) {
        // If a specific user's videos are requested, filter by their owner ID.
        if (!isValidObjectId(userId)) {
            throw new apierrors(400, "Invalid userId");
        }
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        });
    } else {
        // For the public homepage, only show videos that are published.
        pipeline.push({
            $match: {
                isPublished: true,
            },
        });
    }

    // --- Stage 3: Sorting ---
    // Sorts the results. Defaults to newest first.
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1,
            },
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    // --- Stage 4: Add Owner Information ---
    // This is the powerful part. It looks up the owner's details from the 'users' collection.
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        // We only take the fields we need from the user document
                        $project: {
                            username: 1,
                            avatar: 1, // Project the entire avatar object for safety
                        },
                    },
                ],
            },
        },
        {
            // Deconstructs the 'ownerDetails' array to be a single object
            $unwind: "$ownerDetails",
        }
    );

    // --- Execute the Pipeline with Pagination ---
    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        // This helps in getting consistent results with pagination + aggregation
        customLabels: {
            totalDocs: 'totalVideos',
            docs: 'videos'
        }
    };

    try {
        const result = await Video.aggregatePaginate(videoAggregate, options);
        
        // Let's rename the paginated result fields to match what your frontend might expect
        const responseData = {
            docs: result.videos,
            totalDocs: result.totalVideos,
            limit: result.limit,
            page: result.page,
            totalPages: result.totalPages,
            pagingCounter: result.pagingCounter,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
        };

        return res
            .status(200)
            .json(new ApiResponse(200, responseData, "Videos fetched successfully"));

    } catch (error) {
        console.error("Aggregation failed:", error);
        throw new ApiError(500, "Something went wrong while fetching videos.");
    }
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    // TODO: get video, upload to cloudinary, create video

    if ([title, description].some((field) => field?.trim() === "")) {
        throw new apierrors(400, "All fields are required");
    }

    const videoFileLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    
    if (!videoFileLocalPath) {
        throw new apierrors(400, "videoFileLocalPath is required");
    }

    if (!thumbnailLocalPath) {
        throw new apierrors(400, "thumbnailLocalPath is required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
        throw new apierrors(400, "Video file not found");
    }

    if (!thumbnail) {
        throw new apierrors(400, "Thumbnail not found");
    }

    const video = await Video.create({
        title,
        description,
        duration: videoFile.duration,
        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id
        },
        owner: req.user?._id,
        isPublished: true
    });

    const videoUploaded = await Video.findById(video._id);

    if (!videoUploaded) {
        throw new apierrors(500, "videoUpload failed please try again !!!");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video uploaded successfully"));

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    
    // userId = new mongoose.Types.ObjectId(userId)
    if (!isValidObjectId(videoId)) {
        throw new apierrors(400, "Invalid videoId");
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new apierrors(400, "Invalid userId");
    }

    // finding video and its properties using aggregrate pipelines

    const video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup:{
                from:"dislikes",
                localField: "_id",
                foreignField: "video",
                as: "dislikes"
            }
        },
        {
            $lookup:{
                 from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                            }
                        }
                    }
                },
                {
                    $project: {
                            username: 1,
                            "avatar.url": 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                dislikesCount: {
                    $size: "$dislikes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                },
                isDisliked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$dislikes.dislikedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1,
                dislikesCount: 1,
                isDisliked: 1
            }
        }
    ]);

    if (!video) {
        throw new apierrors(500, "failed to fetch video");
    }

    // increment views if video fetched successfully
    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    });

    // add this video to user watch history
    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, video[0], "video details fetched successfully")
        );
})


const updateVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new apierrors(400, "Invalid videoId");
    }

    if (!(title && description)) {
        throw new apierrors(400, "title and description are required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new apierrors(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new apierrors(
            400,
            "You can't edit this video as you are not the owner"
        );
    }

    //deleting old thumbnail and updating with new one
    const thumbnailToDelete = video.thumbnail.public_id;

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new apierrors(400, "thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new apierrors(400, "thumbnail not found");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    public_id: thumbnail.public_id,
                    url: thumbnail.url
                }
            }
        },
        { new: true }
    );

    if (!updatedVideo) {
        throw new apierrors(500, "Failed to update video please try again");
    }

    if (updatedVideo) {
        await deleteOnCloudinary(thumbnailToDelete);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

// delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new apierrors(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new apierrors(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new apierrors(
            400,
            "You can't delete this video as you are not the owner"
        );
    }

    const videoDeleted = await Video.findByIdAndDelete(video?._id);

    if (!videoDeleted) {
        throw new apierrors(400, "Failed to delete the video please try again");
    }

    await deleteOnCloudinary(video.thumbnail.public_id); // video model has thumbnail public_id stored in it->check videoModel
    await deleteOnCloudinary(video.videoFile.public_id, "video"); // specify video while deleting video

    // delete video likes
    await Like.deleteMany({
        video: videoId
    })

    await disLike.deleteMany({
        video: videoId
    })

     // delete video comments
    await Comment.deleteMany({
        video: videoId,
    })
    
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// toggle publish status of a video
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new apierrors(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new apierrors(404, "Video not found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new apierrors(
            400,
            "You can't toogle publish status as you are not the owner"
        );
    }

    const toggledVideoPublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished
            }
        },
        { new: true }
    );

    if (!toggledVideoPublish) {
        throw new apierrors(500, "Failed to toogle video publish status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: toggledVideoPublish.isPublished },
                "Video publish toggled successfully"
            )
        );
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}