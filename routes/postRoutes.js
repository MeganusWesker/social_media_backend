const express = require('express');
const router = express.Router();
const { createPost,
    likeAndUnlikePost,
    deletePost,
    getPostOfFollowings,
    updateCaption,
    commentOnPost,
    deleteComment,
    createVideoPost,
    saveOrUnsavePost,
    getSinglePost } = require('../controllers/postController');
const { isAuthenticatedUser } = require('../middlewares/userAuth');

const singleUpload = require('../middlewares/singleUpload');

router.route("/post/upload").post(singleUpload, isAuthenticatedUser, createPost);

router.route("/video/new").post(singleUpload, isAuthenticatedUser, createVideoPost);


router.route('/post/:id').get(isAuthenticatedUser, likeAndUnlikePost).delete(isAuthenticatedUser, deletePost).put(isAuthenticatedUser, updateCaption);

router.route('/posts').get(isAuthenticatedUser, getPostOfFollowings);

router.route('/get/post/:postId').get(isAuthenticatedUser, getSinglePost);

router.route('/post/comment/:id').put(isAuthenticatedUser, commentOnPost).delete(isAuthenticatedUser, deleteComment);

router.route('/post/save/:id').get(isAuthenticatedUser, saveOrUnsavePost);

module.exports = router;