import mongoose from "mongoose";

const anonymousSchema = new mongoose.Schema({
    review: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    meetingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meeting",
        required: true
    }
}, { timestamps: true });

const Anonymous = mongoose.model("Anonymous", anonymousSchema);

export default Anonymous;