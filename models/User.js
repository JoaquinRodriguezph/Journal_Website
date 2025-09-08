// models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dateOfBirth: { type: Date },
    description: { type: String, default: '' },
    profilePicture: { type: String, default: '/images/default-avatar.png' },
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
    isSuspended: { type: Boolean, default: false }
}, { timestamps: true }); // timestamps adds createdAt and updatedAt fields

module.exports = mongoose.model('User', userSchema);