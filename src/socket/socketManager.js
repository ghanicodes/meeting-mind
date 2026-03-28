import { meetingHandler } from './handlers/meetingHandler.js';
import { scribeHandler } from './handlers/scribeHandler.js';
import { notificationHandler } from './handlers/notificationHandler.js';
import Meeting from '../models/Meeting.js';

export const initSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('meeting:register-organizer', async ({ meetingId }) => {
            await Meeting.findByIdAndUpdate(meetingId, { 
                organizerSocketId: socket.id 
            });
            console.log(`Organizer registered: ${socket.id} for meeting: ${meetingId}`);
        });

        socket.on('disconnect', async () => {
            await Meeting.findOneAndUpdate(
                { organizerSocketId: socket.id },
                { organizerSocketId: null }
            );
            console.log(`User disconnected: ${socket.id}`);
        });

        meetingHandler(socket, io);
        scribeHandler(socket, io);
        notificationHandler(socket, io);
    });
};