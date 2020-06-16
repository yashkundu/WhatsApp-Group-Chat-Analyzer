const mongoose = require('mongoose');

const groupSchema = mongoose.Schema({
    groupName: {
        type: String,
        default: ''
    },
    creator: {
        type: String,
        default:''
    }
});

mongoose.model('Group', groupSchema);