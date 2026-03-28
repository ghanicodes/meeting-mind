import mongoose from "mongoose";

const notesSchema = new mongoose.Schema({
    statement: {
        type: String,
        required: true
    },

    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    meeting:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting',
        required: true
    },

    topic:{
        type: String,
        required: true
    },

    scriber:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

},{ timestamps: true });


const Note = mongoose.model('Note', notesSchema , 'notes');

export default Note;