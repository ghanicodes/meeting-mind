import Anonymous from "../models/Anonymous.js";
import Meeting from "../models/Meeting.js";

//  Create Anonymous Review
export const createAnonymousReview = async (req, res) => {
    try {
        const { review, rating, meetingId } = req.body;
        const userId = req.user._id;

        // 1. Finding the meeting
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ success: false, message: "Meeting not found" });
        }

        // 2. Finding the attendee (Check by ID or by Email for invited/unregistered users)
        const attendeeIndex = meeting.attendees.findIndex(att => {
            const attUserId = String(att.user?._id || att.user || "");
            const currentUserId = String(userId);
            
            // Match by User ID
            if (attUserId === currentUserId) return true;
            
            // Match by Email (for those invited before they had an account)
            if (!att.isRegistered && att.emailForUnregisteredAttendee === req.user.email) {
                return true;
            }
            
            return false;
        });

        console.log(`DEBUG: Feedback submission for meeting ${meetingId} by user ${userId}. Attendee index: ${attendeeIndex}`);

        if (attendeeIndex === -1) {
            return res.status(403).json({ success: false, message: "You are not an attendee of this meeting" });
        }

        // 3. Checking if already provided
        if (meeting.attendees[attendeeIndex].feedbackProvided) {
            console.log(`DEBUG: Duplicate feedback attempt blocked for user ${userId}`);
            return res.status(400).json({ success: false, message: "Feedback already provided for this meeting" });
        }

        // 4. Saving the review
        const anonymousReview = new Anonymous({ review, rating, meetingId });
        await anonymousReview.save();

        // 5. Marking as provided
        meeting.attendees[attendeeIndex].feedbackProvided = true;
        meeting.markModified('attendees'); // Force mongoose to track change in array
        
        await meeting.save();
        console.log(`DEBUG: Feedback flag set to true for user ${userId} in meeting ${meetingId}`);

        res.status(201).json({
            success: true,
            anonymousReview
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message });
    }
};  


// get Anonymous
export const getAnonymousReviews = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const reviews = await Anonymous.find({ meetingId });
        res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message });
    }
};



// get All Anonymous Reviews
export const getAllAnonymousReviews = async (req, res) => {
    try {
        const reviews = await Anonymous.find();
        res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message });
    }
};




// delete Anonymous Review
export const deleteAnonymousReview = async (req, res) => {
    try {
        const { id } = req.params;
        const anonymousReview = await Anonymous.findByIdAndDelete(id);
        if (!anonymousReview) {
            return res.status(404).json({ 
                success: false,
                message: "Anonymous review not found" 
            });
        }
        res.status(200).json({
            success: true,
            message: "Anonymous review deleted successfully"
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message });
    }
};

