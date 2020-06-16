const mongoose = require('mongoose');

const chatSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    type: String,
    date: String,
    time: String,
    sender: String,
    text: String,
    sentiment: {
        type: String,
        default: 'nil'
    }
});

mongoose.model('Chat', chatSchema);