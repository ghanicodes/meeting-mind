import mongoose from "mongoose";


const logoSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    public_id: {
        type: String,
        required: true
    }
}, { _id: false });


const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    logo: {
        type: logoSchema,
        default: null
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required: true,
        select: false
    },

    role: {
        type: String,
        enum: ['organizer'],
        default: 'organizer'
    },



    status: {
        type: String,
        default: 'joined'
    },

    resetPasswordToken: {
        type: String
    },

    resetPasswordExpire: {
        type: Date
    },

}, { timestamps: true });

const Organization = mongoose.model('Organization', organizationSchema, 'users');

export default Organization;