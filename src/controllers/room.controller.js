import { Room } from "../models/room.model.js"; 
import { asyncHandler } from "../utils/asyncHandler.js";
import { apierrors } from "../utils/apierrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createRoom = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
        throw new apierrors(400, "Room name is required.");
    }

    const newRoom = await Room.create({
        name,
        owner: req.user._id, 
        members: [req.user._id] 
    });

    return res.status(201).json(new ApiResponse(200, newRoom, "Room created successfully"));
});

const joinRoom = asyncHandler(async (req, res) => {
    const { roomId } = req.params;

    const room = await Room.findOneAndUpdate(
        { roomId: roomId }, 
        { $addToSet: { members: req.user._id } }, 
        { new: true } 
    );

    if (!room) {
        throw new apierrors(404, "Room not found.");
    }

    return res.status(200).json(new ApiResponse(200, room, "Successfully ensured membership."));
});
const getMyRooms = asyncHandler(async (req, res) => {
    const rooms = await Room.aggregate([
        {
            $match: {
                members: req.user._id 
            }
        },
        {
            $addFields: {
                memberCount: { $size: "$members" } 
            }
        },
        {
            $project: { 
                name: 1,
                roomId: 1,
                memberCount: 1,
                createdAt: 1
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, rooms, "Fetched user's rooms successfully"));
});

const getRoomDetails = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    
    // Find the room and populate the members field with user details
    const room = await Room.findOne({ roomId }).populate("members", "username avatar.url");

    if (!room) {
        throw new apierrors(404, "Room not found.");
    }

    return res.status(200).json(new ApiResponse(200, room, "Room details fetched successfully"));
});



const deleteRoom = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });

    if (!room) throw new apierrors(404, "Room not found.");

    if (room.owner.toString() !== req.user._id.toString()) {
        throw new apierrors(403, "Forbidden: You are not the owner of this room.");
    }


    
    await Room.findByIdAndDelete(room._id);

    return res.status(200).json(new ApiResponse(200, {}, "Room deleted successfully"));
});

const kickMember = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { memberId } = req.body; 

    if (!memberId) throw new apierrors(400, "Member ID is required.");
    
    const room = await Room.findOne({ roomId });

    if (!room) throw new apierrors(404, "Room not found.");

    if (room.owner.toString() !== req.user._id.toString()) {
        throw new apierrors(403, "Forbidden: You are not the owner of this room.");
    }
    if (room.owner.toString() === memberId) {
        throw new apierrors(400, "Owner cannot be kicked.");
    }

    await Room.findByIdAndUpdate(room._id, { $pull: { members: memberId } });

    return res.status(200).json(new ApiResponse(200, {}, "Member kicked successfully"));
});


export {
    createRoom,
    joinRoom,
    getMyRooms,
    deleteRoom,
    kickMember,
    getRoomDetails
};