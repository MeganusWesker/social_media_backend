const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    caption: String,
    isVideoPost:Boolean,

    video:{
        public_id: String,
        url: String,
    },

    image: {
        public_id: String,
        url: String,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }  
    ],

    postSavedBy:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }  
    ],

    comments: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },

            comment: {
                type: String,
                required: true,
            }
        }
    ],

    createdAt: {
        type: Date,
        default: Date.now
    },

});

module.exports = mongoose.model("Post", postSchema);