import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: function () {
            return this.status === 'joined';
        }
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: function () {
            return this.status === 'joined';
        },
        select: false
    },

    role: {
        type: String,
        enum: [
            'admin',
            'attendee',
            'organizer'
        ],
        required: true
    },

    profilePicture: {
        type: {
            url: {
                type: String,
                required: true
            },
            public_id: {
                type: String,
                required: true
            }
        },
        default: {
            url: "https://res.cloudinary.com/dzcmadjl1/image/upload/v1700000000/default-profile-picture.jpg",
            public_id: "default-profile-picture"
        }   
    },

    status:{
        type: String,
        enum:[
            'invited',
            'joined'
        ],
        required: true
    },

    
    resetPasswordToken: {
        type: String
    },

    resetPasswordExpire: {
        type: Date
    }

}, { timestamps: true });


const User = mongoose.model('User', userSchema, 'users');

export default User;