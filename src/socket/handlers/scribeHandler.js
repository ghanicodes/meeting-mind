import Note from '../../models/Note.js';
import Meeting from '../../models/Meeting.js';

export const scribeHandler = (socket, io) => {

    // ✅ Live typing — sab ko dikhe
    socket.on('scribe:typing-confirm', ({ meetingId, text, userId }) => {
        socket.to(meetingId).emit('scribe:typing', { text, userId });
    });

    socket.on('scribe:update', async ({ meetingId, scriberId, userId, topic, statement }) => {
        try {
            // ✅ attendees bhi select karo
            const meeting = await Meeting.findById(meetingId)
                .select('meetingStatus attendees');
            
            if (!meeting) {
                socket.emit('scribe:error', { message: 'Meeting not found' });
                return;
            }

            if (meeting.meetingStatus !== 'continue') {
                socket.emit('scribe:error', { 
                    message: 'Meeting has not started yet' 
                });
                return;
            }

            // ✅ attendees array se isScriber check karo
            const scriberAttendee = meeting.attendees.find(
                a => a.isScriber === true && a.user?.toString() === scriberId
            );

            if (!scriberAttendee) {
                socket.emit('scribe:only-Scriber-error', { 
                    message: 'Only the scriber can create notes' 
                });
                return;
            }

            const note = await Note.create({
                statement,
                topic,
                meeting: meetingId,
                user: userId,
                scriber: scriberId
            });

            console.log(`✅ Note saved: ${note._id}`);

            io.to(meetingId).emit('scribe:updated', {
                noteId: note._id,
                statement: note.statement,
                topic: note.topic,
                scriberId,
                userId,
                createdAt: note.createdAt
            });

        } catch (err) {
            console.log('scribe:update error:', err.message);
            socket.emit('scribe:error', { message: err.message });
        }
    });

    socket.on('scribe:confirm-saved', ({ meetingId }) => {
        io.to(meetingId).emit('scribe:saved', { 
            meetingId,
            message: 'Notes have been saved successfully'
        });
    });

};