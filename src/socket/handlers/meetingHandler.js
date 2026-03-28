import User from '../../models/User.js';
import mongoose from 'mongoose';
import Meeting from '../../models/Meeting.js';

const getUserInfo = async (userId) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return { name: 'Unknown', avatar: null, initials: 'U' };
        }
        const user = await User.findById(userId).select('name profilePicture');
        const name = user?.name || 'Unknown';
        const avatar = user?.profilePicture?.url || null;
        const initials = name.charAt(0).toUpperCase();
        return { name, avatar, initials };
    } catch (err) {
        console.log('getUserInfo error:', err.message);
        return { name: 'Unknown', avatar: null, initials: 'U' };
    }
};

const markAttendance = async (meetingId, userId, isPresent) => {
    try {
        const meeting = await Meeting.findById(meetingId)
            .select('attendees organizerSocketId organizedBy');
        if (!meeting) return { success: false, meeting: null };

        const attendee = meeting.attendees.find(
            a => a?.user?.toString() === userId
        );
        if (!attendee) return { success: false, meeting };

        attendee.isPresent = isPresent;
        await meeting.save();
        console.log(`✅ Attendance marked: userId=${userId} isPresent=${isPresent}`);
        return { success: true, meeting };
    } catch (err) {
        console.log('markAttendance error:', err.message);
        return { success: false, meeting: null };
    }
};

export const meetingHandler = (socket, io) => {

    // ✅ Join
    socket.on('meeting:join', async ({ meetingId, userId }) => {
        socket.join(meetingId);

        const { name, avatar, initials } = await getUserInfo(userId);

        const meeting = await Meeting.findById(meetingId)
            .select('attendees organizerSocketId organizedBy scriber');

        // ✅ Organizer auto-register
        if (meeting?.organizedBy?.toString() === userId) {
            meeting.organizerSocketId = socket.id;
            await meeting.save();
            console.log(`Organizer auto-registered: ${socket.id}`);
        }

        const { success } = await markAttendance(meetingId, userId, true);

        // ✅ Scriber ID attendees array se nikalo
        const scriberAttendee = meeting?.attendees?.find(a => a.isScriber === true);
        const scriberId = scriberAttendee?.user?.toString() || null;

        socket.emit('meeting:join-confirmed', {
            success: true,
            message: 'Joined successfully',
            meetingId,
            userId,
            name,
            avatar,
            initials,
            scriberId  // ✅ Frontend ko bhi bhejo
        });

        socket.to(meetingId).emit('meeting:user-joined', {
            userId, name, avatar, initials,
            message: `${name} joined the meeting`
        });

        const updatedMeeting = await Meeting.findById(meetingId)
            .select('organizerSocketId');

        if (success && updatedMeeting?.organizerSocketId) {
            io.to(updatedMeeting.organizerSocketId).emit('meeting:attendance-marked', {
                userId, name, avatar, initials,
                isPresent: true,
                message: `✅ ${name} ki attendance lag gayi`
            });
        }
    });

    // ✅ Leave
    socket.on('meeting:leave', async ({ meetingId, userId }) => {
        const { name, avatar, initials } = await getUserInfo(userId);
        socket.leave(meetingId);

        const { success, meeting } = await markAttendance(meetingId, userId, false);

        socket.emit('meeting:leave-confirmed', {
            success: true,
            message: 'Left successfully',
            meetingId,
            userId
        });

        socket.to(meetingId).emit('meeting:user-left', {
            userId, name, avatar, initials,
            message: `${name} left the meeting`
        });

        if (success && meeting?.organizerSocketId) {
            io.to(meeting.organizerSocketId).emit('meeting:attendance-marked', {
                userId, name, avatar, initials,
                isPresent: false,
                message: `❌ ${name} meeting se chala gaya`
            });
        }
    });

    // ✅ Started — duplicate hata diya, sirf ek rakha
    socket.on('meeting:started', async ({ meetingId, userId }) => {
        socket.join(meetingId);

        await Meeting.findByIdAndUpdate(meetingId, {
            meetingStatus: 'continue'
        });

        io.to(meetingId).emit('meeting:orginizer started', {
            meetingId, startedBy: userId,
            message: 'Meeting has started'
        });
    });

    // ✅ Ended
    socket.on('meeting:ended', async ({ meetingId, userId }) => {
        await Meeting.findByIdAndUpdate(meetingId, {
            meetingStatus: 'completed'
        });

        io.to(meetingId).emit('meeting:orginizer ended', {
            meetingId, endedBy: userId,
            message: 'Meeting has ended'
        });
    });

};