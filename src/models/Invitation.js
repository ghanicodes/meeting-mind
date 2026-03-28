import mongoose from "mongoose";

const invitedToSchema = new mongoose.Schema({
    
    name: {
        type: String,
        required: function () {
            return !this.isRegistered;
        }
    },


    email: {
        type: String,
        required: function () {
            return !this.isRegistered;
        }
    },

    isRegistered: {
        type: Boolean,
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function () {
            return this.isRegistered;
        }

    }



}  , {_id: false})

const invitationSchema = new mongoose.Schema({
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },

    invitedTo:{
        type: invitedToSchema,
        required: true
    },

    invitedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    invitedMeetings:{
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Meeting',
        required: true
    },

    isInvitationOpen:{
        type: Boolean,
        default: true
    },

    isInvitationAccepted:{
        type: Boolean,
        default: false
    },

    isScriber:{
        type: Boolean,
        default: false
    }


} , {timestamps: true});

const Invitation = mongoose.model('Invitation', invitationSchema, 'invitations');

export default Invitation;