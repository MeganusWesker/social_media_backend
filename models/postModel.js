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
            },

            likes: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                }  
            ],

            createdAt: {
                type: Date,
                default: Date.now
            },

            replies:[
                {
                    commentBy: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User"
                    },

                    repliedTo: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User"
                    },
        
                    comment: {
                        type: String,
                    },

                    likes: [
                        {
                            type: mongoose.Schema.Types.ObjectId,
                            ref: "User"
                        }  
                    ],

                    createdAt: {
                        type: Date,
                        default: Date.now
                    },
                }
            ]
        }
    ],

    createdAt: {
        type: Date,
        default: Date.now
    },

});

module.exports = mongoose.model("Post", postSchema);