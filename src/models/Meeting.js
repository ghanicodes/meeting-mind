import mongoose from "mongoose";

const attendeeSchema = new mongoose.Schema({
    
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
            return this.isRegistered;
        },
    },

    isRegistered: {
        type: Boolean,
        required: true
    },
    
    emailForUnregisteredAttendee: {
        type: String,
        required: function() {
            return !this.isRegistered;
        },
    },

    nameForUnregisteredAttendee: {
        type: String,
        required: function() {
            return !this.isRegistered;
        },
    },

    isPresent:{
        type: Boolean,
        default: false
    },

    isScriber: {
        type: Boolean,
        default: false
    },

    feedbackProvided: {
        type: Boolean,
        default: false
    }
});

const meetingSchema = new mongoose.Schema({

    agenda:{
        type: String,
        required: true,
        minLength: 3,
        maxLength: 100
    },

    organizedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    organizerSocketId: {
    type: String,
    default: null
},
    scriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    notes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Note',
        default: [],
    },

    startAt: {
        type: Date,
        required: true
    },

    attendees: {
        type: [attendeeSchema],
        ref: 'User',
        required: true
    },

    description:{
        type: String
    },

    isRecurring:{
        type: Boolean,
        default: false
    },

    recurringDuration:{
        type: Number,
        required: function() {
            return this.isRecurring;
        }
    },

    recurringFrequency:{
        type: Number,
        required: function() {
            return this.isRecurring;
        }
    },

    meetingStatus:{
        type: String,
        enum: [
            "scheduled",
            "continue",
            "completed",
            "cancelled"
        ]
    },

    meetingEndAt: {
        type: Date
    },

    recurringFrom:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting',
        default: null
    },

    meetingType:{
        type: String,
        enum:[
            'online',
            "onsite"
        ]
    },

    location: {
        type: String,
        required: function() {
            return this.meetingType === 'onsite';
        }

    },

    meetingLink: {
        type: String,
        required: function() {
            return this.meetingType === 'online';
        }
    },



},{ timestamps: true });


const Meeting = mongoose.model('Meeting', meetingSchema , 'meetings');

export default Meeting;