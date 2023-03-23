const express = require('express');
const { createConversation, getMyAllConversations, createMessage, getAllMessagesOfParticularConversation } = require('../controllers/chatController');
const router = express.Router();

const {isAuthenticatedUser} = require('../middlewares/userAuth');

router.route("/conversation/new").post(isAuthenticatedUser,createConversation);

router.route("/message/new").post(isAuthenticatedUser,createMessage);

router.route("/conversation/all").get(isAuthenticatedUser,getMyAllConversations);

router.route("/message/all").get(isAuthenticatedUser,getAllMessagesOfParticularConversation);

module.exports = router;