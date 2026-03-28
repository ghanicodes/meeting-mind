export const notificationHandler = (socket, io) => {

    // Jab kisi ko meeting invite bhejo
    // socket.emit('notification:invite', { toUserId, meetingId, orgName })
    socket.on('notification:invite', ({ toUserId, meetingId, orgName }) => {
        // Private notification — sirf us user ko
        // toUserId se uska socket dhundhna padega
        // (yeh hum User-to-Socket map se karenge — next step)
        socket.to(toUserId).emit('notification:invite', { meetingId, orgName });
    });

    // Meeting shuru hone wali hai — reminder
    socket.on('notification:reminder', ({ meetingId, message }) => {
        io.to(meetingId).emit('notification:reminder', { message });
    });

    // General alert — admin se
    socket.on('notification:alert', ({ meetingId, message }) => {
        io.to(meetingId).emit('notification:alert', { message });
    });

};