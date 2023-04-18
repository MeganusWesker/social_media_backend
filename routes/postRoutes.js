const express = require('express');
const router = express.Router();
const { createPost,
    likeAndUnlikePost,
    deletePost,
    getPostOfFollowings,
    updateCaption,
    commentOnPost,
    createVideoPost,
    saveOrUnsavePost,
    getSinglePost,
    likeCommentOnPost,
    updateCommentOnPost,
    deleteCommentOnPost,
    replyToComment,
    likeReply,
    editReplyOnPost,
    deleteReplyOnPost,
    replyToaReply,
    toggleNotifications } = require('../controllers/postController');
const { isAuthenticatedUser } = require('../middlewares/userAuth');

const singleUpload = require('../middlewares/singleUpload');

router.route("/post/upload").post(singleUpload, isAuthenticatedUser, createPost);

router.route("/video/new").post(singleUpload, isAuthenticatedUser, createVideoPost);


router.route('/post/:id').get(isAuthenticatedUser, likeAndUnlikePost).delete(isAuthenticatedUser, deletePost).put(isAuthenticatedUser, updateCaption);

router.route('/posts').get(isAuthenticatedUser, getPostOfFollowings);

router.route('/get/post/:postId').get(isAuthenticatedUser, getSinglePost);

router.route('/post/comment/:postId').post(isAuthenticatedUser, commentOnPost)

router.route('/post/comment/:postId/:commentId').get(isAuthenticatedUser, likeCommentOnPost).put(isAuthenticatedUser, updateCommentOnPost).delete(isAuthenticatedUser, deleteCommentOnPost).post(isAuthenticatedUser, replyToComment);

router.route('/post/comment/:postId/:commentId/:replyId').get(isAuthenticatedUser, likeReply).put(isAuthenticatedUser,editReplyOnPost).delete(isAuthenticatedUser,deleteReplyOnPost).post(isAuthenticatedUser,replyToaReply);


router.route('/post/save/:id').get(isAuthenticatedUser, saveOrUnsavePost);

router.route('/notifications').get(isAuthenticatedUser, toggleNotifications);

module.exports = router;