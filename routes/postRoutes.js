const express = require('express');
const router = express.Router();
const {createPost,likeAndUnlikePost,deletePost,getPostOfFollowings,updateCaption,commentOnPost,deleteComment} = require('../controllers/postController');
const {isAuthenticatedUser} = require('../middlewares/userAuth');

const singleUpload=require('../middlewares/singleUpload');

router.route("/post/upload").post(singleUpload,isAuthenticatedUser,createPost);

router.route('/post/:id').get(isAuthenticatedUser,likeAndUnlikePost).delete(isAuthenticatedUser,deletePost).put(isAuthenticatedUser,updateCaption);

router.route('/posts').get(isAuthenticatedUser,getPostOfFollowings);

router.route('/post/comment/:id').put(isAuthenticatedUser,commentOnPost).delete(isAuthenticatedUser,deleteComment);

module.exports = router;