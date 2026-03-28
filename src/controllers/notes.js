
//notes apis

import Meeting from "../models/Meeting.js";
import Note from "../models/Note.js";

//

export async function createNote(req, res){

    try {

        const { statement, topic, meetingId, user } = req.body;

        if(!statement || !topic || !meetingId || !user){
            return res.status(400).json({ message: 'All fields are required' });
        }

        const meeting = await Meeting.findById(meetingId);

        if(!meeting){
            return res.status(404).json({ message: 'Meeting not found' });
        }

        const isAttendee = meeting.attendees.some(attendee => attendee?.user?.toString() === user);

        if(!isAttendee){
            return res.status(400).json({ message: 'User is not a attendee of this meeting' });
        }

        const note = new Note({
            statement,
            user,
            topic,
            meeting: meetingId,
            scriber: req.user._id
        });

        await note.save();

        res.status(201).json({ message: 'Note created successfully', success: true, data: note });

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: 'Internal server error', success: false });
    }

}


//edit note:

export async function editNote(req, res){

    try {

        const { statement } = req.body;
        const noteId = req.params.id;

        if(!noteId || !statement){
            return res.status(400).json({ message: 'All fields are required' });
        }

        const note = await Note.findById(noteId);

        if(!note){
            return res.status(404).json({ message: 'Note not found', success: false });
        }

        note.statement = statement;

        await note.save();

        res.status(200).json({ message: 'Note updated successfully', success: true, data: note });

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: 'Internal server error', success: false });
    }

}

//delete note:

export async function deleteNote(req, res){

    try {

        const noteId = req.params.id;

        if(!noteId){
            return res.status(400).json({ message: 'Note ID is required' });
        }

        const note = await Note.findById(noteId);

        if(!note){
            return res.status(404).json({ message: 'Note not found', success: false });
        }

        await note.deleteOne();

        res.status(200).json({ message: 'Note deleted successfully', success: true });

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: 'Internal server error', success: false });
    }

}

// read note with all queries possible

export async function getNotes(req, res){

    try {

        const { meetingId, user, topic, scriber } = req.query;

        const query = {};

        if(meetingId){
            query.meeting = meetingId;
        }

        if(user){
            query.user = user;
        }

        if(topic){
            query.topic = topic;
        }

        if(scriber){
            query.scriber = scriber;
        }

        const notes = await Note.find(query)
        .populate('meeting')
        .populate('user')
        .populate('scriber')
        .sort({ createdAt: -1 });

        res.status(200).json({ message: 'Notes fetched successfully', success: true, data: notes });

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: 'Internal server error', success: false });
    }

}

// get note by id

export async function getNoteById(req, res){

    try {

        const noteId = req.params.id;

        if(!noteId){
            return res.status(400).json({ message: 'Note ID is required' });
        }

        const note = await Note.findById(noteId);

        if(!note){
            return res.status(404).json({ message: 'Note not found', success: false });
        }

        res.status(200).json({ message: 'Note fetched successfully', success: true, data: note });

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: 'Internal server error', success: false });
    }

}




























// import Meeting from "../models/Meeting.js";
// import Note from "../models/Note.js";
// import { getIO } from "../socket.js";

// //add 
// export async function createNote(req, res) {
//   try {
//     const { statement, topic, meetingId, user } = req.body;

//     if (!statement || !topic || !meetingId || !user) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const meeting = await Meeting.findById(meetingId);
//     if (!meeting) {
//       return res.status(404).json({ message: "Meeting not found" });
//     }

//     const isAttendee = meeting.attendees.some(
//       (attendee) => attendee?.user?.toString() === user,
//     );
//     // const isOrganizer = meeting.organizedBy.toString() === user;
//      console.log(isAttendee,"attende")

//     if (!isAttendee) {
//       return res
//         .status(400)
//         .json({ message: "User is not authorized to create notes for this meeting" });
//     }

//     const note = new Note({
//       statement,
//       user,
//       topic,
//       meeting: meetingId,
//       scriber: req.user._id, 
//     });

//     await note.save();

//     await Meeting.findByIdAndUpdate(meetingId, {
//       $push: { notes: note._id }
//     });

//     getIO().to(meetingId).emit("note-created", note);

//     res.status(201).json({
//       message: "Note created successfully",
//       success: true,
//       data: note,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal server error", success: false });
//   }
// }

// export async function editNote(req, res) {
//   try {
//     const { statement } = req.body;
//     const noteId = req.params.id;

//     if (!noteId || !statement) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const note = await Note.findById(noteId);
//     if (!note) {
//       return res.status(404).json({ message: "Note not found", success: false });
//     }

//     note.statement = statement;
//     await note.save();

//     // SOCKET EMIT: Sabko updated note bhejo
//     getIO().to(note.meeting.toString()).emit("note-updated", note);

//     res.status(200).json({
//       message: "Note updated successfully",
//       success: true,
//       data: note,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal server error", success: false });
//   }
// }

// export async function deleteNote(req, res) {
//   try {
//     const noteId = req.params.id;
    
//     // 1. Note dhoondein taake meetingId mil sake
//     const note = await Note.findById(noteId);
//     if (!note) {
//       return res.status(404).json({ message: "Note not found", success: false });
//     }

//     const meetingId = note.meeting.toString();

//     await Meeting.findByIdAndUpdate(meetingId, {
//       $pull: { notes: noteId }
//     });

//     await note.deleteOne();

   
//     getIO().to(meetingId).emit("note-deleted", noteId);

//     res.status(200).json({ 
//       message: "Note deleted successfully and removed from meeting", 
//       success: true 
//     });

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal server error", success: false });
//   }
// }

// export async function getNotes(req, res) {
//   try {
//     const { meetingId, user, topic, scriber } = req.query;

//     const query = {};

//     if (meetingId) {
//       query.meeting = meetingId;
//     }

//     if (user) {
//       query.user = user;
//     }

//     if (topic) {
//       query.topic = topic;
//     }

//     if (scriber) {
//       query.scriber = scriber;
//     }

//     const notes = await Note.find(query);

//     res
//       .status(200)
//       .json({
//         message: "Notes fetched successfully",
//         success: true,
//         data: notes,
//       });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal server error", success: false });
//   }
// }


// export async function getNoteById(req, res) {
//   try {
//     const noteId = req.params.id;

//     if (!noteId) {
//       return res.status(400).json({ message: "Note ID is required" });
//     }

//     const note = await Note.findById(noteId);

//     if (!note) {
//       return res
//         .status(404)
//         .json({ message: "Note not found", success: false });
//     }

//     res
//       .status(200)
//       .json({
//         message: "Note fetched successfully",
//         success: true,
//         data: note,
//       });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal server error", success: false });
//   }
// }


































// import { Server } from "socket.io";
// import { noteHandlers } from "./utils/Notes-socket-handler.js";
// import { metingHandler } from "./utils/Meeting-socket-handler.js";

// let io;

// export const initIO = (server) => {
//   if (!io) {
//     io = new Server(server, {
//       cors: {
//         origin: "*",
//         methods: ["GET", "POST","PUT","DELETE","PATCH"],
//         credentials: true
//       },
//       pingTimeout: 60000,
//       pingInterval: 25000
//     });

//     io.on("connection", (socket) => {
//       console.log(`🔌 New connection: ${socket.id}`);

     
//       metingHandler(io, socket);
//       noteHandlers(io, socket);

//       socket.on("disconnect", (reason) => {
//         console.log(`🔌 Disconnected: ${socket.id} (Reason: ${reason})`);
//       });

//       socket.on("error", (error) => {
//         console.error(`❌ Socket error for ${socket.id}:`, error);
//       });
//     });

//     console.log("✅ Socket.IO initialized correctly");
//   }
//   return io;
// };

// export const getIO = () => {
//   if (!io) {
//     throw new Error("❌ Socket.io not initialized!");
//   }
//   return io;
// };











// import express from 'express';
// import http from "http";
// import cookieParser from 'cookie-parser';
// import cors from 'cors';
// import morgan from 'morgan';

// // Custom Imports
// import connectDb from './config/connectDb.js';
// import { initIO } from './socket.js';
// import authRoutes from './routers/authRoutes.js';
// import meetingRouter from './routers/meetingRouter.js';
// import notesRouter from './routers/notesRouter.js';
// import disputeRouter from './routers/disputeRouter.js';

// const app = express();
// const PORT = process.env.PORT || 5000;

// // 1. Server Setup
// const server = http.createServer(app);

// initIO(server);

// // 2. Global Middlewares (Routes se pehle rakhein)
// app.use(morgan('dev')); // Fixed: Added 'dev' format
// app.use(cors({
//     origin: true,
//     credentials: true
// }));
// app.use(express.json());
// app.use(cookieParser());

// // 3. Routes
// app.get('/', (req, res) => {
//     res.send('Server is running');
// });

// app.use('/auth', authRoutes);
// app.use('/meetings', meetingRouter);
// app.use('/notes', notesRouter);
// app.use('/dispute', disputeRouter);

// // 4. DB Connection & Server Start
// connectDb()
//     .then(() => {
//         console.log("✅ MongoDb connected");
//         server.listen(PORT, () => {
//             console.log(`🚀 Server is running at http://localhost:${PORT}`);
//         });
//     })
//     .catch(err => {
//         console.error("❌ Database connection failed:", err.message);
//     });





// const getMeetingId = (data) => {
//   let id = typeof data === 'object' ? data.meetingId || data.id : data;
//   if (id && typeof id === 'string') {
//     return id.replace(/['"]+/g, '').trim();
//   }
//   return id || null;
// };

// export const metingHandler = (io, socket) => {
//   // Join Meeting Room
//   socket.on("join-meeting", (data) => {
//     const meetingId = getMeetingId(data);
//     if (!meetingId) return socket.emit("error", { message: "Invalid Meeting ID" });

//     socket.join(meetingId);
    
//     // Store meetingId in socket object to use it on disconnect
//     socket.currentMeetingId = meetingId; 

//     socket.to(meetingId).emit("user-joined", { 
//       userId: socket.id,
//       timestamp: new Date()
//     });
//   });

//   // Manual Leave (Button click)
//   socket.on("leave-meeting", (data) => {
//     const meetingId = getMeetingId(data) || socket.currentMeetingId;
//     if (!meetingId) return;

//     socket.to(meetingId).emit("user-left", {
//       userId: socket.id,
//       message: "User has left the meeting",
//       timestamp: new Date()
//     });

//     socket.leave(meetingId);
//     socket.currentMeetingId = null;
//   });

//   socket.on("disconnect", () => {
//     const meetingId = socket.currentMeetingId;
//     if (meetingId) {
//       socket.to(meetingId).emit("user-left", {
//         userId: socket.id,
//         message: "User disconnected",
//         timestamp: new Date()
//       });
//       console.log(`🔌 User ${socket.id} disconnected from ${meetingId}`);
//     }
//   });

//   socket.on("update-meeting-status", (data) => {
//     const meetingId = getMeetingId(data);
//     const { status } = data;
//     if (!meetingId || !status) return;

//     io.to(meetingId).emit("meeting-status-updated", {
//       meetingId,
//       status,
//       updatedBy: socket.id,
//       timestamp: new Date()
//     });
//   });
// };














// import Note from "../models/Note.js";

// const getMeetingId = (data) => {
//   let id = typeof data === 'object' ? data.meetingId || data.id : data;
//   if (id && typeof id === 'string') {
//     return id.replace(/['"]+/g, '').trim();
//   }
//   return id || null;
// };

// export const noteHandlers = (io, socket) => {

//   socket.on("create-note", async (data) => {
//     try {
//       const { statement, topic, meetingId, userId } = data;
      
//       if (!statement || !meetingId || !userId) {
//         return socket.emit("error", { message: "Missing required fields for note creation" });
//       }

//       const newNote = new Note({
//         statement,
//         topic,
//         meeting: meetingId,
//         user: userId,
//       });

//       await newNote.save();
      
//       // Broadcast to everyone in the room including sender
//       io.to(meetingId).emit("note-created", newNote);
//       console.log(`📝 Note created in meeting ${meetingId} by ${userId}`);
//     } catch (error) {
//       console.error("❌ Note creation error:", error);
//       socket.emit("error", { message: "Note save nahi ho saka", details: error.message });
//     }
//   });

//   // Edit Note
//   socket.on("edit-note", async (data) => {
//     try {
//       const meetingId = getMeetingId(data);
//       if (!meetingId || !data.noteId) return;

//       // In a real app, you might want to update the DB here too
//       // For now, we broadcast the update
//       socket.to(meetingId).emit("note-updated", data);
//       console.log(`✏️ Note ${data.noteId} updated in meeting ${meetingId}`);
//     } catch (error) {
//       socket.emit("error", { message: "Note update failure", details: error.message });
//     }
//   });

//   // Delete Note
//   socket.on("delete-note", (data) => {
//     const meetingId = getMeetingId(data);
//     if (meetingId && data.noteId) {
//       socket.to(meetingId).emit("note-deleted", data.noteId);
//       console.log(`🗑️ Note ${data.noteId} deleted in meeting ${meetingId}`);
//     }
//   });

//   // Typing Indicator
//   socket.on("typing-note", (data) => {
//     const meetingId = getMeetingId(data);
//     const { userId, isTyping } = data;

//     if (meetingId && userId) {
//       socket.to(meetingId).emit("user-typing-note", { userId, isTyping });
//     }
//   });
// };