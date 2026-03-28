import User from "../models/User.js";
import Note from "../models/Note.js"; // add this

import Meeting from "../models/Meeting.js";
import mongoose from "mongoose";
import sendEmail from "../utils/sendEmail.js";
import Invitation from "../models/Invitation.js";
import Organization from "../models/Organization.js";


export async function createMeeting(req, res) {
    try {
        const {
            agenda,
            startAt,
            description,
            attendees,
            isRecurring,
            recurringDuration,
            recurringFrequency,
            meetingType,
            location,
            meetingLink,
            organizationId
        } = req.body;

        // ✅ 1. Required fields
        if (!agenda || !startAt || !meetingType) {
            return res.status(400).json({
                success: false,
                message: "Agenda, start time and meeting type are required."
            });
        }

        // ✅ 2. Validate meetingType
        if (!['online', 'onsite'].includes(meetingType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid meeting type. Must be 'online' or 'onsite'."
            });
        }

        // ✅ 3. Validate location / meetingLink
        if (meetingType === 'onsite' && !location) {
            return res.status(400).json({
                success: false,
                message: "Location is required for onsite meetings."
            });
        }

        if (meetingType === 'online' && !meetingLink) {
            return res.status(400).json({
                success: false,
                message: "Meeting link is required for online meetings."
            });
        }

        // ✅ 4. Validate date
        const firstStartAt = new Date(startAt);
        if (isNaN(firstStartAt.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid start date."
            });
        }

        if (firstStartAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Start time cannot be in the past."
            });
        }

        // ✅ 5. Validate attendees
        if (!Array.isArray(attendees) || attendees.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one attendee is required."
            });
        }

        let users = await User.find({ status: 'joined' });

        for (const attendee of attendees) {

            if (typeof attendee.isRegistered !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: "Invalid attendee format."
                });
            }

            // if (attendee.isRegistered) {

            //     if (!attendee.user) {
            //         return res.status(400).json({
            //             success: false,
            //             message: "Registered attendee must have user ID."
            //         });
            //     }

            //     let user = users.find(
            //         user => user.email === attendee.emailForUnregisteredAttendee
            //     );

            //     if (!user) {
            //         return res.status(400).json({
            //             success: false,
            //             message: `User with Id ${attendee.user} is not registered.`
            //         });
            //     }
            // }


            if (attendee.isRegistered) {

                if (!attendee.user) {
                    return res.status(400).json({
                        success: false,
                        message: "Registered attendee must have user ID."
                    });
                }

                // Check if the attendee ID belongs to a joined User
                let user = users.find(
                    u => u._id.toString() === attendee.user.toString()
                );

                // If not found in joined users, check if it's an Organization (Organizers can be attendees)
                if (!user) {
                    let orgCheck = await Organization.findById(attendee.user);
                    if (orgCheck) user = orgCheck;
                }
                
                // Fallback check in case the user isn't 'joined' but still exists
                if (!user) {
                    let userCheck = await User.findById(attendee.user);
                    if (userCheck) user = userCheck;
                }

                if (!user) {
                    return res.status(400).json({
                        success: false,
                        message: `User with Id ${attendee.user} is not registered.`
                    });
                }
            }


            if (!attendee.isRegistered) {

                if (!attendee.emailForUnregisteredAttendee || !attendee.nameForUnregisteredAttendee) {
                    return res.status(400).json({
                        success: false,
                        message: "Unregistered attendee must have email and name."
                    });
                }

                let user = users.find(
                    user => user.email === attendee.emailForUnregisteredAttendee
                );

                if (user) {
                    return res.status(400).json({
                        success: false,
                        message: `User with email ${attendee.emailForUnregisteredAttendee} already exists.`
                    });
                }

                let isInvitedUser = await User.findOne({
                    email: attendee.emailForUnregisteredAttendee,
                    status: 'invited'
                });

                if (!isInvitedUser) {
                    let newUser = new User({
                        name: attendee.nameForUnregisteredAttendee,
                        email: attendee.emailForUnregisteredAttendee,
                        password: null,
                        role: 'attendee',
                        status: 'invited',
                        meetings: [] // ✅ added
                    });

                    await newUser.save();
                }
            }
        }

        // ✅ 6. Scriber validation
        const scriberCount = attendees.filter(a => a.isScriber).length;
        if (scriberCount !== 1) {
            return res.status(400).json({
                success: false,
                message: "Exactly one scriber is required."
            });
        }

        // ✅ 7. Recurring validation
        if (isRecurring) {
            if (!recurringDuration || !recurringFrequency) {
                return res.status(400).json({
                    success: false,
                    message: "Recurring duration and frequency are required."
                });
            }

            if (Number(recurringDuration) <= 0 || Number(recurringFrequency) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Recurring values must be positive numbers."
                });
            }
        }

        // ✅ 8. Admin organization validation
        if (req.user.role === 'admin' && !organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization ID is required for admin users."
            });
        }

        if (organizationId) {
            const organization = await Organization.findOne ({
                _id: organizationId,
                role: 'organizer'
            });

            if (!organization) {
                return res.status(404).json({
                    success: false,
                    message: "Organization not found."
                });
            }
        }

        // ===============================
        // 🔽 ORIGINAL LOGIC (UNCHANGED)
        // ===============================

        const organizerId = req.user.role === 'admin'
            ? organizationId
            : req.user._id;

        const parentMeetingId = new mongoose.Types.ObjectId();
        let meetingsToCreate = [];

        const baseData = {
            agenda,
            description,
            organizedBy: organizerId,
            attendees,
            meetingType,
            location: meetingType === 'onsite' ? location : null,
            meetingLink: meetingType === 'online' ? meetingLink : null,
            meetingStatus: 'scheduled'
        };

        meetingsToCreate.push({
            ...baseData,
            _id: parentMeetingId,
            startAt: firstStartAt,
            isRecurring,
            recurringDuration: isRecurring ? Number(recurringDuration) : undefined,
            recurringFrequency: isRecurring ? Number(recurringFrequency) : undefined
        });

        if (isRecurring && recurringDuration && recurringFrequency) {
            const totalMeetings = Math.floor(
                Number(recurringDuration) / Number(recurringFrequency)
            );

            let nextDate = new Date(firstStartAt);

            for (let i = 0; i < totalMeetings; i++) {
                nextDate = new Date(
                    nextDate.getTime() +
                    (Number(recurringFrequency) * 24 * 60 * 60 * 1000)
                );

                meetingsToCreate.push({
                    ...baseData,
                    startAt: new Date(nextDate),
                    recurringFrom: parentMeetingId,
                    isRecurring: false,
                    recurringDuration: undefined,
                    recurringFrequency: undefined,
                });
            }
        }

        const createdMeetings = await Meeting.insertMany(meetingsToCreate);

        // =====================================
        // ✅ SAVE MEETINGS IN USERS (NEW BLOCK)
        // =====================================

        const meetingIds = createdMeetings.map(m => m._id);

         for (const attendee of attendees) {
            let user;
            let emailTo;
            let nameTo;

            if (attendee.isRegistered) {
                user = await User.findById(attendee.user);
                if (!user) user = await Organization.findById(attendee.user);
                
                if (user) {
                    if (user.role !== 'organizer') {
                        await User.findByIdAndUpdate(user._id, {
                            $addToSet: { meetings: { $each: meetingIds } }
                        });
                    }
                    emailTo = user.email;
                    nameTo = user.name;
                }
            } else {
                user = await User.findOne({
                    email: attendee.emailForUnregisteredAttendee
                });
                if (user) {
                    await User.findByIdAndUpdate(user._id, {
                        $addToSet: { meetings: { $each: meetingIds } }
                    });
                }
                emailTo = attendee.emailForUnregisteredAttendee;
                nameTo = attendee.nameForUnregisteredAttendee || user?.name || "Attendee";
            }

            // =====================================
            // ✅ SEND EMAILS
            // =====================================
            if (emailTo) {
                const dateObj = new Date(startAt);
                const isOnline = meetingType === 'online';
                
                const templateName = attendee.isRegistered 
                    ? (isOnline ? 'registered_online' : 'registered_onsite')
                    : (isOnline ? 'unregistered_online' : 'unregistered_onsite');

                const emailContext = {
                    meeting_title: agenda,
                    user_name: nameTo,
                    meeting_date: dateObj.toLocaleDateString(),
                    meeting_time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    meeting_role: attendee.isScriber ? 'Scribe' : 'Attendee',
                    is_recurring: isRecurring,
                    recurring_detail: isRecurring ? `Every ${recurringFrequency} for ${recurringDuration} occurrence(s)` : '',
                    meeting_link: isOnline ? (meetingLink || '') : undefined,
                    location: !isOnline ? (location || '') : undefined
                };

                // fire-and-forget email sending
                await sendEmail({
                    to: emailTo,
                    subject: `Meeting Invitation: ${agenda}`,
                    template: templateName,
                    context: emailContext
                }).catch(err => {
                    console.error("Failed to send meeting invitation email to:", emailTo, "Error:", err.message);
                });
            }
        }

        res.status(201).json({
            success: true,
            count: createdMeetings.length,
            data: createdMeetings
        });

    } catch (error) {
        console.error("Critical API Error:", error.message);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

export async function getMeetingById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid meeting ID format'
            });
        }

        const meeting = await Meeting.findById(id)
            .populate('organizedBy')
            .populate('scriber')
            .populate('attendees.user')
            .populate('notes')
            .lean();

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                meeting,
                notes: meeting.notes
            }
        });

    } catch (error) {
        console.log("Get Meeting With Notes Error", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// export async function getMeetings(req, res) {
//     try {
//         console.log('Get Meetings')
//         let filter = {}

//         if (req.user.role === 'organizer') {
//             filter.organizedBy = req.user._id;
//         }

//         if (req.user.role === 'attendee') {
//             filter["attendees.user"] = req.user._id;
//         }

//         if (req.query.search) {
//             filter.$or = [
//                 { agenda: { $regex: req.query.search, $options: 'i' } },
//                 { description: { $regex: req.query.search, $options: 'i' } }
//             ]
//         }

//         if (req.query.status) {
//             filter.status = req.query.status;
//         }

//         if (req.query.startDate) {
//             filter.startAt = { $gte: new Date(req.query.startDate) };
//         }

//         if (req.query.endDate) {
//             filter.startAt = { $lte: new Date(req.query.endDate) };
//         }

//         let meetings = await Meeting.find(filter)
//             .sort({ startAt: -1 });

//         return res.status(200).json({
//             success: true,
//             message: 'Meetings fetched successfully',
//             data: meetings
//         })

//     } catch (error) {
//         console.log("Get Meetings Error", error.message);
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }

// }
export async function getMeetings(req, res) {
    try {
        console.log('Get Meetings')
        let filter = {}

        if (req.user.role === 'organizer') {
            filter.organizedBy = req.user._id;
        }

        if (req.user.role === 'attendee') {
            filter["attendees.user"] = req.user._id;
        }

        if (req.query.search) {
            filter.$or = [
                { agenda: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ]
        }

        // ✅ FIXED (status bug)
        if (req.query.status) {
            filter.meetingStatus = req.query.status;
        }

        if (req.query.startDate) {
            filter.startAt = { $gte: new Date(req.query.startDate) };
        }

        if (req.query.endDate) {
            filter.startAt = { $lte: new Date(req.query.endDate) };
        }

        let meetings = await Meeting.find(filter)
            .sort({ startAt: -1 })
            .populate('organizedBy')
            .populate('attendees.user');



        const now = new Date();

        // ✅ AUTO STATUS UPDATE
        const updatedMeetings = await Promise.all(
            meetings.map(async (meeting) => {

                let updatedStatus = meeting.meetingStatus;

                if (meeting.meetingStatus !== 'cancelled') {

                    // ✅ START → CONTINUE
                    if (now >= meeting.startAt && !meeting.meetingEndAt) {
                        updatedStatus = 'continue';
                    }

                    // ✅ WITH END TIME
                    if (
                        meeting.meetingEndAt &&
                        now >= meeting.startAt &&
                        now < meeting.meetingEndAt
                    ) {
                        updatedStatus = 'continue';
                    }

                    // ✅ COMPLETED
                    if (meeting.meetingEndAt && now >= meeting.meetingEndAt) {
                        updatedStatus = 'completed';
                    }
                }

                if (updatedStatus !== meeting.meetingStatus) {
                    meeting.meetingStatus = updatedStatus;
                    await meeting.save();
                }

                return meeting;
            })
        );

        return res.status(200).json({
            success: true,
            message: 'Meetings fetched successfully',
            data: updatedMeetings
        })

    } catch (error) {
        console.log("Get Meetings Error", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}





export async function updateMeeting(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid meeting ID format'
            });
        }

        const meeting = await Meeting.findById(id);

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // only organizer can edit
        if (req.user.role !== 'admin' && meeting.organizedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized - Only the organizer can edit this meeting'
            });
        }

        // only scheduled meetings can be edited
        if (meeting.meetingStatus !== 'scheduled') {
            return res.status(400).json({
                success: false,
                message: `Meeting cannot be edited because it is ${meeting.meetingStatus}`
            });
        }

        const {
            agenda,
            startAt,
            description,
            meetingStatus,
            meetingType,
            location,
            meetingLink
        } = req.body;

        // check if user provided anything to update
        if (!agenda && !startAt  && !description && !meetingStatus && !meetingType && !location && !meetingLink) {
            return res.status(400).json({
                success: false,
                message: 'No updates provided'
            });
        }

        //start at cannot be in past
        if (startAt && new Date(startAt) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Start time cannot be in the past'
            });
        }

        // meetingType validation
        if (meetingType === 'online' && !meetingLink) {
            return res.status(400).json({
                success: false,
                message: 'Meeting link is required for online meetings'
            });
        }

        if (meetingType === 'onsite' && !location) {
            return res.status(400).json({
                success: false,
                message: 'Location is required for onsite meetings'
            });
        }

        // only update fields that were actually sent
        if (agenda) meeting.agenda = agenda;
        if (startAt) meeting.startAt = new Date(startAt);
        if (description) meeting.description = description;
        if (meetingStatus) meeting.meetingStatus = meetingStatus;
        if (meetingType) meeting.meetingType = meetingType;
        if (location) meeting.location = location;
        if (meetingLink) meeting.meetingLink = meetingLink;

        const updatedMeeting = await meeting.save();

        return res.status(200).json({
            success: true,
            message: 'Meeting updated successfully',
            data: updatedMeeting
        });

    } catch (error) {
        console.log("Update Meeting Error", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}



//update attendance 

// export async function updateAttendance(req, res) {
//     try {
//         const { meetingId, userId, isPresent } = req.body;

//         if (!meetingId || !userId || typeof isPresent !== 'boolean') {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Missing required fields'
//             });
//         }

//         const meeting = await Meeting.findById(meetingId);

//         if (!meeting) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Meeting not found'
//             });
//         }

//         // Only organizer can update attendance
//         if (meeting.organizedBy.toString() !== req.user.id) {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Unauthorized - Only the organizer can update attendance'
//             });
//         }

//         // checking if between start and end time
//         const now = new Date();
//         if (now < meeting.startAt || now > meeting.endAt) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Meeting is not in progress'
//             });
//         }

//         const attendee = meeting.attendees.find(attendee => attendee?.user?.toString() === userId);

//         if (!attendee) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Attendee not found'
//             });
//         }

//         attendee.isPresent = isPresent;

//         await meeting.save();

//         return res.status(200).json({
//             success: true,
//             message: 'Attendance updated successfully',
//             data: meeting
//         });

//     } catch (error) {
//         console.log("Update Attendance Error", error.message);
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }
export async function updateAttendance(req, res) {
    try {
        const { meetingId, userId, isPresent } = req.body;

        if (!meetingId || !userId || typeof isPresent !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const meeting = await Meeting.findById(meetingId);

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        if (meeting.organizedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized - Only the organizer can update attendance'
            });
        }

        const now = new Date();

        // ✅ FIXED LOGIC (endAt optional)
        if (now < meeting.startAt) {
            return res.status(400).json({
                success: false,
                message: 'Meeting has not started yet'
            });
        }

        if (meeting.meetingEndAt && now > meeting.meetingEndAt) {
            return res.status(400).json({
                success: false,
                message: 'Meeting already ended'
            });
        }

        const attendee = meeting.attendees.find(attendee => attendee?.user?.toString() === userId);

        if (!attendee) {
            return res.status(404).json({
                success: false,
                message: 'Attendee not found'
            });
        }

        attendee.isPresent = isPresent;

        await meeting.save();

        return res.status(200).json({
            success: true,
            message: 'Attendance updated successfully',
            data: meeting
        });

    } catch (error) {
        console.log("Update Attendance Error", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}




// End Metting 
export async function endMeeting(req, res) {
    try {
        const { id } = req.params;

        const meeting = await Meeting.findById(id);

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }

        if (meeting.organizedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // ✅ SET END TIME + COMPLETE
        meeting.meetingEndAt = new Date();
        meeting.meetingStatus = 'completed';

        await meeting.save();

        return res.status(200).json({
            success: true,
            message: "Meeting ended successfully",
            data: meeting
        });

    } catch (error) {
        console.log("End Meeting Error", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}



export async function deleteMeeting(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid meeting ID format'
            });
        }

        const meeting = await Meeting.findById(id);

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Only organizer or admin can delete
        if (req.user.role !== 'admin' && meeting.organizedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized - Only the organizer or an admin can delete this meeting'
            });
        }

        await Meeting.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Meeting deleted successfully'
        });

    } catch (error) {
        console.log("Delete Meeting Error", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}





// Add Attendee to a meeting
export const addAttendeeToMeeting = async (req, res) => {
    try {
        const { isRegistered, user, emailForUnregisteredAttendee, nameForUnregisteredAttendee, meetingId } = req.body;

        const meeting = await Meeting.findById(meetingId);

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }

        // Only organizer can add
        if (meeting.organizedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Only organizer can add attendees"
            });
        }

        // Already exists check
        const alreadyExists = meeting.attendees.find(att => {
            if (isRegistered) {
                return att.user?.toString() === user;
            } else {
                return att.emailForUnregisteredAttendee === emailForUnregisteredAttendee;
            }
        });

        if (alreadyExists) {
            return res.status(400).json({
                success: false,
                message: "Attendee already added"
            });
        }

        let newAttendee;

        if (isRegistered) {
            const existingUser = await User.findById(user);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            newAttendee = {
                isRegistered: true,
                user: existingUser._id,
                isPresent: false
            };

            //  EMAIL
            await sendEmail({
                to: existingUser.email,
                subject: `📅 Meeting Invite: ${meeting.agenda}`,
                template: `registered_${meeting.meetingType}`,
                context: {
                    user_name: existingUser.name,
                    organizer_name: req.user.name,
                    meeting_title: meeting.agenda,
                    meeting_date: meeting.startAt.toLocaleDateString(),
                    meeting_time: meeting.startAt.toLocaleTimeString(),
                    meeting_link: meeting.meetingLink,
                    location: meeting.location || "Online Workspace"
                }
            });

        } else {

            // create invited user (same as your createMeeting logic)
            let invitedUser = await User.findOne({ email: emailForUnregisteredAttendee });

            if (!invitedUser) {
                invitedUser = new User({
                    name: nameForUnregisteredAttendee,
                    email: emailForUnregisteredAttendee,
                    password: null,
                    role: 'attendee',
                    status: 'invited',
                    meetings: [meeting._id]
                });

                await invitedUser.save();
            }

            newAttendee = {
                isRegistered: false,
                emailForUnregisteredAttendee,
                nameForUnregisteredAttendee,
                isPresent: false
            };

            // EMAIL (signup redirect)
            await sendEmail({
                to: emailForUnregisteredAttendee,
                subject: `📅 Meeting Invite: ${meeting.agenda}`,
                template: `unregistered_${meeting.meetingType}`,
                context: {
                    user_name: nameForUnregisteredAttendee,
                    organizer_name: req.user.name,
                    meeting_title: meeting.agenda,
                    meeting_date: meeting.startAt.toLocaleDateString(),
                    meeting_time: meeting.startAt.toLocaleTimeString(),
                    meeting_link: `${process.env.FRONTEND_URL}/signup`,
                    location: meeting.location || "Online Workspace"
                }
            });
        }

        // push into meeting
        meeting.attendees.push(newAttendee);
        await meeting.save();

        return res.status(200).json({
            success: true,
            message: "Attendee added successfully",
            data: meeting
        });

    } catch (error) {
        console.log("Add Attendee Error", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};