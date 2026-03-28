import express from 'express';
import checkAuth from '../middleware/checkAuth.js';

import { createMeeting, getMeetings, getMeetingById , updateMeeting, updateAttendance, addAttendeeToMeeting, deleteMeeting, endMeeting } from '../controllers/meeting.js';

const meetingRouter = express.Router();

meetingRouter.post('/create' , checkAuth, createMeeting);
meetingRouter.get('/id/:id', checkAuth, getMeetingById);
meetingRouter.get('/getAllMeetings', checkAuth, getMeetings);
meetingRouter.put('/edit/:id', checkAuth, updateMeeting);
meetingRouter.delete('/delete/:id', checkAuth, deleteMeeting);
meetingRouter.put('/updateAttendance', checkAuth, updateAttendance);
meetingRouter.put('/addAttendee', checkAuth, addAttendeeToMeeting);
meetingRouter.put('/endMeeting/:id', checkAuth, endMeeting);





export default meetingRouter;