const User = require("../models/userModel");
const catchAsyncErrors = require('../middlewares/catchAsyncError');
const ErrorHandler = require("../utils/errorHandler");
const Conversation = require("../models/conversationModel");
const Message = require("../models/messageModel");
const { getDataUri } = require("../utils/dataUri");
const cloudinary = require("cloudinary");

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

    const {conversationId}= req.query;

  const messages = await Message.find({conversationId});

    res.status(201).json({
        success:true,
        messages,
    });

});

exports.createImageMessage=catchAsyncErrors(async(req,res,next)=>{

    const {conversationId,isImageMessage}= req.body;

    const file = req.file;

    if (!file) {
        return next(new ErrorHandler("please enter image ", 400));
    }

    const fileUrl = getDataUri(file);

    myCloud = await cloudinary.v2.uploader.upload(fileUrl.content, {
        folder: "imageMessages",
    });

  

  const message=  await Message.create({
        conversationId,
        isImageMessage,
        senderId:req.user.id,
        image:{
            public_id:myCloud.public_id,
            url:myCloud.secure_url
        }
    });

    res.status(201).json({
        success:true,
        message:'message sent',
        message,
    });

});