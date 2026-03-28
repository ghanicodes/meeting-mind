import Dispute from "../models/Dispute.js";
import Meeting from "../models/Meeting.js";
import mongoose from "mongoose";

// CREATE
export async function createDispute(req, res) {
    try {
        const { statement, meetingId, noteId } = req.body;

        if (!statement || !meetingId || !noteId) {
            return res.status(400).json({
                success: false,
                message: 'statement, meetingId and noteId are required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(meetingId) || !mongoose.Types.ObjectId.isValid(noteId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid meetingId or noteId format'
            });
        }

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // only attendees of the meeting can raise a dispute
        const isAttendee = meeting.attendees.some(
            a => a.user?.toString() === req.user.id
        );

        if (!isAttendee) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized - Only attendees of this meeting can raise a dispute'
            });
        }

        // prevent duplicate dispute on same note by same user
        // const existingDispute = await Dispute.findOne({
        //     note: noteId,
        //     raisedBy: req.user.id
        // });

        // if (existingDispute) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'You have already raised a dispute for this note'
        //     });
        // }

        const dispute = await Dispute.create({
            statement,
            raisedBy: req.user.id,
            meeting: meetingId,
            note: noteId
        });

        return res.status(201).json({
            success: true,
            message: 'Dispute raised successfully',
            data: dispute
        });

    } catch (error) {
        console.log("Create Dispute Error", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// READ BY ID
export async function getDisputeById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid dispute ID format'
            });
        }

        const dispute = await Dispute.findById(id)
            .populate('raisedBy')
            .populate('meeting')
            .populate('note');

        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: 'Dispute not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: dispute
        });

    } catch (error) {
        console.log("Get Dispute By ID Error", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// READ ALL with advanced queries
export async function getAllDisputes(req, res) {
    try {
        let filter = {};

        // filter by meeting
        if (req.query.meetingId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.meetingId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid meetingId format'
                });
            }
            filter.meeting = req.query.meetingId;
        }

        // filter by resolved status
        if (req.query.isResolved) {
            filter.isResolved = req.query.isResolved === 'true';
        }

        // filter by user who raised dispute
        if (req.query.raisedBy) {
            if (!mongoose.Types.ObjectId.isValid(req.query.raisedBy)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid raisedBy format'
                });
            }
            filter.raisedBy = req.query.raisedBy;
        }

        // search by statement
        if (req.query.search) {
            filter.statement = { $regex: req.query.search, $options: 'i' };
        }

        // date range filter
        if (req.query.startDate) {
            filter.createdAt = { $gte: new Date(req.query.startDate) };
        }

        if (req.query.endDate) {
            filter.createdAt = {
                ...filter.createdAt,
                $lte: new Date(req.query.endDate)
            };
        }

        // pagination
        const page  = Number(req.query.page)  || 1;
        const limit = Number(req.query.limit) || 10;
        const skip  = (page - 1) * limit;

        const total = await Dispute.countDocuments(filter);

        const disputes = await Dispute.find(filter)
            .populate('raisedBy')
            .populate('meeting')
            .populate('note')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: disputes
        });

    } catch (error) {
        console.log("Get All Disputes Error", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// UPDATE (statement only — dispute must be unresolved)
export async function updateDispute(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid dispute ID format'
            });
        }

        const dispute = await Dispute.findById(id);

        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: 'Dispute not found'
            });
        }

        // only the person who raised it can update it
        if (dispute.raisedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized - Only the person who raised this dispute can update it'
            });
        }

        if (dispute.isResolved) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update an already resolved dispute'
            });
        }

        const { statement } = req.body;

        if (!statement) {
            return res.status(400).json({
                success: false,
                message: 'No updates provided'
            });
        }

        dispute.statement = statement;
        await dispute.save();

        return res.status(200).json({
            success: true,
            message: 'Dispute updated successfully',
            data: dispute
        });

    } catch (error) {
        console.log("Update Dispute Error", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// RESOLVE
export async function resolveDispute(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid dispute ID format'
            });
        }

        const dispute = await Dispute.findById(id);

        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: 'Dispute not found'
            });
        }

        if (dispute.isResolved) {
            return res.status(400).json({
                success: false,
                message: 'Dispute is already resolved'
            });
        }

        dispute.isResolved = true;
        dispute.resolvedAt = new Date();
        await dispute.save();

        return res.status(200).json({
            success: true,
            message: 'Dispute resolved successfully',
            data: dispute
        });

    } catch (error) {
        console.log("Resolve Dispute Error", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}