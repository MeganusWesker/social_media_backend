const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');
const sendToken = require('../utils/jwtToken');
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require('../middlewares/catchAsyncError');
const Post = require('../models/postModel');
const cloudinary = require("cloudinary");
const { getDataUri } = require('../utils/dataUri');
const Notification = require('../models/notificatinModel');

exports.registerUser = catchAsyncErrors(async (req, res, next) => {

    const { name, email, password,userName } = req.body;

    const file = req.file;


    if (!name || !email || !password || !userName ) {
        return next(new ErrorHandler("please enter all fields ", 400));
    }



    let userexists = await User.findOne({ email });

    if (userexists) {
        return next(new ErrorHandler("user already exist with this email", 403));
    }

    let myCloud = undefined;

    if (file) {
        const fileUrl = getDataUri(file);

        myCloud = await cloudinary.v2.uploader.upload(fileUrl.content, {
            folder: "avatars",
        });
    }

    const otp = Math.floor(Math.random() * 1000000);

    const subject = `confirm you're otp`;

    const text = `hey this is you're otp ${otp} valid for 5 mintues please verify ignore if you did'nt registerd or requested`;

   

    await User.create({
        name,
        email,
        password,
        userName,
        avatar:{
          public_id :myCloud ? myCloud.public_id:null,
          url:myCloud ? myCloud.secure_url:null,
        },
        otp,
        otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000)
    });

    const emailObject = {
        email,
        subject,
        text
    };


    try {
        await sendEmail(emailObject);

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    res.status(200).json({
        success: true,
        message: "otp sent please verify you're email"
    });

});

exports.verify = catchAsyncErrors(async (req, res, next) => {

    const otp = Number(req.body.otp);
    const email = req.body.email;

    if (!email) {
        return next(new ErrorHandler("please enter you're email ", 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorHandler("no user find with given email ", 400));
    }

  
    if (otp !== user.otp || user.otp_expire < Date.now()) {
        return next(new ErrorHandler("invalid otp or expired otp", 400));
    }

    user.verified = true;
    user.otp = undefined;
    user.otp_expire = undefined;

    await user.save();

    sendToken(res, user, 200, "account verified");
});




// login user => api/v1/login


exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    // checks email and password entered by user or not 
    if (!email || !password) {
        return next(new ErrorHandler('please enter email & password', 400));
    }
    // finding user in database 
    const user = await User.findOne({ email }).select('+password').populate("posts followers following");

    

    if (!user) {
        return next(new ErrorHandler('incorrect email or password', 400));
    }


    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler('incorrect email or password', 400));
    }



    sendToken(res, user, 200, "loged in succefully");
});

exports.followUserUnfollowUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!user) {
        return next(new ErrorHandler("can't find user", 403));
    }

    if (user._id.toString() === req.user.id.toString()) {
        return next(new ErrorHandler("you can't follow youreself", 404));
    }

    if (user.followers.includes(req.user.id)) {
        const index = user.followers.indexOf(req.user.id);
        user.followers.splice(index, 1);


        const currentIndex = currentUser.following.indexOf(req.params.id);
        currentUser.following.splice(currentIndex, 1);


        await currentUser.save();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Unfollowed successfully"
        });
    }
    else {
        user.followers.push(req.user.id);
        currentUser.following.push(req.params.id);

        const notification=await Notification.create({
            user:{
                avatar:currentUser.avatar.url,
                _id:req.user.id,
                userName:req.user.userName
            },
            notificationMessage:'followed you'
        });

        user.notifications.push(notification._id);

        await user.save();
        await currentUser.save();

        res.status(200).json({
            success: true,
            message: "Followed successfully"
        });
    }
});



//logout user api/v1/logout

exports.logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: process.env.NODE_ENV === "Development" ? false : true,
        secure: process.env.NODE_ENV === "Development" ? false : true,
        sameSite: process.env.NODE_ENV === "Development" ? false : "none",
    });

    res.status(200).json({
        success: true,
        message: 'logged out'
    });
});

// update / change password => /api/v1/password/update

exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect", 400));
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new ErrorHandler("password does not match", 400));
    }

    user.password = req.body.newPassword;

    await user.save();

    res.status(201).json({
        success: true,
        message: "Password has been changed"
    })
});

// forgot password

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorHandler("user not found with this email", 404));
    }

    const otp = Math.floor(Math.random() * 10000000);

    const subject = `you're otp for password reset`;

    const text = `hey this is you're otp ${otp} valid for 5 mintues please verify ignore if you did'nt registerd or requested`;

    user.otp = otp;
    user.otp_expire = new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000);



    await user.save({ validateBeforeSave: false });

    const emailObject = {
        email: user.email,
        subject,
        text,
    }


    try {

        await sendEmail(emailObject);

        res.status(200).json({
            success: true,
            message: `email sent to ${user.email} succesfully`
        })


    } catch (error) {
        user.otp = undefined;
        user.otp_expire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler(error.message, 500));
    }

});

// reseting password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
    const { otp } = req.body;

    console.log(otp);

    const user = await User.findOne({
        otp,
        otp_expire: { $gt: Date.now() }
    });



    if (!user) {
        return next(new ErrorHandler("reset password otp is invalid or has been expired", 404));
    }

    const { confirmPassword, password } = req.body;

    if (password !== confirmPassword) {
        return next(new ErrorHandler(" confimr password dosen't matched with you're new password ", 403));
    }

    user.password = password;
    user.otp = undefined;
    user.otp_expire = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        message: "password rested successfully"
    });
});


exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    const { name,bio,userName } = req.body;

    const file=req.file;

    if (name) {
        user.name = name;
    }

    if (bio) {
        user.bio = bio;
    }

    if (userName) {
        user.userName = userName;
    }


    if(file){
        const fileUrl = getDataUri(file);

        const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content, {
            folder: "avatars",
        });

        if(user.avatar.public_id !==null){
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        }

        user.avatar.public_id = myCloud.public_id;
        user.avatar.url = myCloud.secure_url;
    }


    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile has been Updated Successfully"
    })

});


exports.updateProfilePicture = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    const file = req.file;

    if (!file) {
        return next(new ErrorHandler("please enter profile picture to update ", 400));
    }

    const fileUrl = getDataUri(file);

    const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content, {
        folder: "avatars",
    });

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);


    user.avatar.public_id = myCloud.public_id;
    user.avatar.url = myCloud.secure_url;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile Picture Updated Successfully",
    });

});

exports.deleteMyProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    const posts = user.posts;
    const followers = user.followers;
    const following = user.following;
    const userId = req.user.id;

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    await user.remove();

    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    });

    for (let i = 0; i < posts.length; i++) {
        const post = await Post.findById(posts[i]);
        await cloudinary.v2.uploader.destroy(post.image.public_id);
        post.remove();
    }

    for (let i = 0; i < followers.length; i++) {
        const follower = await User.findById(followers[i]);
        const index = follower.following.indexOf(userId);
        follower.following.splice(index, 1);
        await follower.save();
    }

    for (let i = 0; i < following.length; i++) {

        const followingUser = await User.findById(following[i]);

        const index = followingUser.followers.indexOf(userId);

        followingUser.followers.splice(index, 1);
        await followingUser.save();
    }


    res.status(200).json({
        success: true,
        message: "User delted succesfully "
    });
});

exports.getProfile = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.user.id).populate("posts followers following notifications likedPosts");


    let totalLikes=0;

    user.posts.forEach((item)=>{
        totalLikes+=item.likes.length;
    });


    res.status(200).json({
        success: true,
        user,
        totalLikes,
    })
});

exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id).populate("posts followers following notifications likedPosts");
   
    if (!user) {
        return next(new ErrorHandler("can't find user", 400));
    }


    let isFollowed=false;
   

    user.followers.forEach((item)=>{
        if(item._id.toString()===req.user.id){
            isFollowed=true;
        }
    });

    let searchedUserTotalLikes=0;

    user.posts.forEach((item)=>{
        searchedUserTotalLikes+=item.likes.length;
    })



    res.status(200).json({
        success: true,
        user,
        isFollowed,
        searchedUserTotalLikes,
    })
});



exports.getMyPosts = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.user.id);

    const posts = [];

    for (let i = 0; i < user.posts.length; i++) {
        const post = await Post.findById(user.posts[i]).populate(
            "likes comments.user owner"
        );
        posts.push(post);
    }

    res.status(200).json({
        success: true,
        posts,
    });
});

exports.getUserPost = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    const posts = [];

    for (let i = 0; i < user.posts.length; i++) {
        const post = await Post.findById(user.posts[i]).populate(
            "likes comments.user owner"
        );
        posts.push(post);
    }

    res.status(200).json({
        success: true,
        posts,
    });
});

exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
    const keyword=req.query.keyword || "";

    const users=await User.find({
        userName:{
            $regex:keyword,
            $options:"i",
        },

        _id:{
            $ne:req.user.id,
        },

       
    });

    res.status(200).json({
        success: true,
        users,
    });


});


exports.getMYAllNotifications = catchAsyncErrors(async (req, res, next) => {
 
    const user = await User.findById(req.user.id).populate('notifications');


  res.status(200).json({
        success: true,
        myNotifications:user.notifications.reverse(),
    });

});


