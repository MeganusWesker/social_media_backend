const express = require('express');
const { createConversation,
        getMyAllConversations,
        createMessage,
        getAllMessagesOfParticularConversation,
        createImageMessage,
        toggleNewMessageField,
        toggleMessageInConversation 
    } = require('../controllers/chatController');
const router = express.Router();

const { isAuthenticatedUser } = require('../middlewares/userAuth');

const singleUpload=require('../middlewares/singleUpload');

router.route("/conversation/new").post(isAuthenticatedUser, createConversation);

router.route("/message/new").post(isAuthenticatedUser, createMessage);

router.route("/imageMessage/new").post(singleUpload,isAuthenticatedUser, createImageMessage);

router.route("/conversation/all").get(isAuthenticatedUser, getMyAllConversations);

router.route("/toggle/newMessage").get(isAuthenticatedUser, toggleNewMessageField);

router.route("/toggle/conversation/messages/:conversationId").put(isAuthenticatedUser,toggleMessageInConversation);

router.route("/message/all").get(isAuthenticatedUser, getAllMessagesOfParticularConversation);

module.exports = router;