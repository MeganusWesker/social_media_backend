const express = require('express');
const router = express.Router();

const {
        registerUser,
        loginUser,
        followUserUnfollowUser,
        logout,
        updatePassword,
        updateProfile,
        deleteMyProfile,
        getProfile,
        getUserProfile,
        getAllUsers,
        getMyPosts,
        forgotPassword,
        resetPassword,
        getUserPost,
        verify,
        getMYAllNotifications
} =require('../controllers/userController');

const multipleUpload=require('../middlewares/multipleUpload');

const singleUpload=require('../middlewares/singleUpload');

const {isAuthenticatedUser} = require('../middlewares/userAuth');

//register user 
router.route('/register').post(singleUpload,registerUser);

router.route('/verify/email').post(verify);

router.route('/login').post(loginUser);

router.route('/user/:id').get(isAuthenticatedUser,followUserUnfollowUser);

router.route('/logout').get(isAuthenticatedUser,logout);

router.route('/update/password').put(isAuthenticatedUser,updatePassword);

router.route('/update/profile').put(singleUpload,isAuthenticatedUser,updateProfile);

router.route('/delete/me').delete(isAuthenticatedUser,deleteMyProfile);

router.route('/me').get(isAuthenticatedUser,getProfile);

router.route('/my/notifications').get(isAuthenticatedUser,getMYAllNotifications);

router.route('/profile/users/:id').get(isAuthenticatedUser,getUserProfile); 

router.route('/users').get(isAuthenticatedUser,getAllUsers); 

router.route("/my/posts").get(isAuthenticatedUser, getMyPosts);

// forgot password 
router.route('/forgot/password').post(forgotPassword);

//resetPassword
router.route('/reset/password').put(resetPassword);

router.route('/userposts/:id').get(isAuthenticatedUser,getUserPost);



module.exports = router;