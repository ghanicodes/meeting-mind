// import express from 'express';
// import { createServer } from 'http';           // ← naya
// import { Server } from 'socket.io';            // ← naya
// import { initSocket } from './socket/socketManager.js'; // ← naya
// // import { initAttendanceWorker } from './utils/attendanceQueue.js';

// import connectDb from './config/connectDb.js';
// import dns from 'node:dns';
// import authRoutes from './routers/authRoutes.js';
// dns.setServers(['1.1.1.1', '8.8.8.8']);
// import cookieParser from 'cookie-parser';
// import cors from 'cors';

// // Routers (same as before — kuch nahi badla)
// import meetingRouter from './routers/meetingRouter.js';
// import notesRouter from './routers/notesRouter.js';
// import disputeRouter from './routers/disputeRouter.js';
// import organizationRouter from './routers/organization.js';
// import anonymousRouter from './routers/Anonymous.js';


// const app = express();
// // const httpServer = createServer(app);           // ← naya
// // const io = new Server(httpServer, {             // ← naya
// //     cors: {
// //         origin: true,
// //         credentials: true
// //     }
// // });

// const PORT = process.env.PORT;

// app.use(cors({ origin: true, credentials: true }));
// app.use(express.json());
// app.use(cookieParser());

// app.use('/auth', authRoutes);
// app.use('/meetings', meetingRouter);
// app.use('/notes', notesRouter);
// app.use('/dispute', disputeRouter);
// app.use('/organizations', organizationRouter);
// app.use('/anonymous', anonymousRouter);

// app.get('/', (req, res) => {
//     res.send('Server is running');
// });

// connectDb()
//     .then(() => {
//         console.log("MongoDb connected");

//         // initSocket(io);                             // ← naya: socket events register karo
//         app.listen(PORT, () => {             // ← app.listen → httpServer.listen
//             console.log(`Server is running at http://localhost:${PORT}`);
//         });
//     });





// server.js (Vercel compatible)
import express from 'express';
import connectDb from './config/connectDb.js';
import authRoutes from './routers/authRoutes.js';
import meetingRouter from './routers/meetingRouter.js';
import notesRouter from './routers/notesRouter.js';
import disputeRouter from './routers/disputeRouter.js';
import organizationRouter from './routers/organizationRouter.js';
import anonymousRouter from './routers/Anonymous.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dns from 'node:dns';

// DNS servers set karna (optional, network reliability ke liye)
dns.setServers(['1.1.1.1', '8.8.8.8']);

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/auth', authRoutes);
app.use('/meetings', meetingRouter);
app.use('/notes', notesRouter);
app.use('/dispute', disputeRouter);
app.use('/organizations', organizationRouter);
app.use('/anonymous', anonymousRouter);

app.get('/', (req, res) => {
  res.send('Server is running');
});

// Connect MongoDB
connectDb()
  .then(() => console.log("MongoDb connected"))
  .catch(err => console.error("MongoDb connection error:", err));

// ✅ Vercel serverless ke liye app ko export karo
export default app;