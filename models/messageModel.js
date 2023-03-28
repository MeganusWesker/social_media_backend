const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

   conversationId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Conversation",
   },

    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },

    message:{
        type:String,
    },

    isImageMessage:Boolean,

    image:{
        public_id:{
            type:String,
           
        },
        url:{
            type:String,
        }
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },

});

module.exports = mongoose.model("Message",messageSchema);