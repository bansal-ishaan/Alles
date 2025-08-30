import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
    content: {
        type: String,
        required: true,
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    room: {
        type: Schema.Types.ObjectId,
        ref: "Room",
        required: true,
    },
}, { timestamps: true });

export const Message = mongoose.model("Message", messageSchema);