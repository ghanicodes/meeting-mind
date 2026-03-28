// notes routes

import express from 'express';
import checkAuth from '../middleware/checkAuth.js';
import { createNote, editNote, deleteNote, getNotes, getNoteById } from '../controllers/notes.js';

const notesRouter = express.Router();

notesRouter.post('/create' , checkAuth, createNote);
notesRouter.put('/edit/:id', checkAuth, editNote);
notesRouter.delete('/delete/:id', checkAuth, deleteNote);
notesRouter.get('/getAllNotes', checkAuth, getNotes);
notesRouter.get('/getNoteById/:id', checkAuth, getNoteById);

export default notesRouter;
