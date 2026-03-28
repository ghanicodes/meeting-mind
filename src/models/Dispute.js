import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema({

    statement: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 500
    },

    raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    meeting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting',
        required: true
    },

    note: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
        required: true
    },

    isResolved: {
        type: Boolean,
        default: false
    },

    resolvedAt: {
        type: Date,
        default: null
    }

}, { timestamps: true });

const Dispute = mongoose.model('Dispute', disputeSchema, 'disputes');

export default Dispute;