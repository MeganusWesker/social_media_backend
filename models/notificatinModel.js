const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({


    user: {

        avatar: String,
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        userName: String,

    },

    notificationMessage: {
        type: String,
    },

    isNewMessage: {
        type: Boolean,
        default: true,
    },


    createdAt: {
        type: Date,
        default: Date.now
    },

});

module.exports = mongoose.model("Notification", notificationSchema);