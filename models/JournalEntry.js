// models/JournalEntry.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const journalEntrySchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    photo: { type: String }, // URL to the uploaded photo
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Creates a reference to the User model
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);