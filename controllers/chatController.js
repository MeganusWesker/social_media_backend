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
  }).populate('members messages');


    res.status(201).json({
        success:true,
        conversations,
    });
});

exports.createMessage=catchAsyncErrors(async(req,res,next)=>{

    const {conversationId,textMessage,recieverId}= req.body;

    const receivingUser=await User.findById(recieverId);
    const conversation=await Conversation.findById(conversationId);

    receivingUser.newMessage=true,

    await receivingUser.save();

  const message=  await Message.create({
        conversationId,
        message:textMessage,
        senderId:req.user.id,
    });

    conversation.messages.push(message._id);

    await conversation.save();

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

    const {conversationId,isImageMessage,recieverId}= req.body;

    const receivingUser=await User.findById(recieverId);

    const conversation=await Conversation.findById(conversationId);


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

    receivingUser.newMessage=true,

    await receivingUser.save();

    conversation.messages.push(message._id);

    await conversation.save();

    res.status(201).json({
        success:true,
        message:'message sent',
        message,
    });

});

exports.toggleNewMessageField=catchAsyncErrors(async(req,res,next)=>{

   const user=await User.findById(req.user.id);

   user.newMessage=false,

   await user.save();

    res.status(201).json({
        success:true,
        userNewMessage:user.newMessage,
    });

});

exports.toggleMessageInConversation=catchAsyncErrors(async(req,res,next)=>{

    const {conversationId}= req.params;

    const conversation=await Conversation.findById(conversationId);


   conversation.messages.forEach(async(item)=>{
        const message=  await Message.findById(item.toString());
        message.isNewMessage=false;
        message.save();
   });

   await conversation.save();

     res.status(201).json({
         success:true,
     });
 
 });