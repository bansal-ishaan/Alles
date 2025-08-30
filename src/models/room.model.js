
import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";

const roomSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    roomId: {
        type: String,
        required: true,
        default: () => nanoid(10), 
        unique: true,
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

export const Room = mongoose.model("Room", roomSchema);