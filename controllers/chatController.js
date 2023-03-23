const User = require("../models/userModel");
const catchAsyncErrors = require('../middlewares/catchAsyncError');
const ErrorHandler = require("../utils/errorHandler");
const Conversation = require("../models/conversationModel");
const Message = require("../models/messageModel");


exports.createConversation=catchAsyncErrors(async(req,res,next)=>{

    const {members} =req.body;

    await Conversation.create({members});

    res.status(201).json({
        success:true,
        message:"conversation created successfully"
    });
});


exports.getMyAllConversations=catchAsyncErrors(async(req,res,next)=>{

  const conversations=await Conversation.find({
    members:{$in:req.user.id}
  }).populate('members');


    res.status(201).json({
        success:true,
        conversations,
    });
});

exports.createMessage=catchAsyncErrors(async(req,res,next)=>{

    const {conversationId,textMessage}= req.body;

    await Message.create({
        conversationId,
        message:textMessage,
        senderId:req.user.id,
    });

    res.status(201).json({
        success:true,
        message:'message sent',
        textMessage,
    });

});

exports.getAllMessagesOfParticularConversation=catchAsyncErrors(async(req,res,next)=>{

    const {conversationId}= req.body;

  const messages = await Message.find({conversationId});

    res.status(201).json({
        success:true,
        messages,
    });

});