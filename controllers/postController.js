const User = require("../models/userModel");
const Post = require("../models/postModel");
const catchAsyncErrors = require('../middlewares/catchAsyncError');
const ErrorHandler = require("../utils/errorHandler");
const cloudinary = require("cloudinary");
const { getDataUri } = require("../utils/dataUri");
const Notification = require('../models/notificatinModel');

exports.createPost = catchAsyncErrors(async (req, res, next) => {

  const file = req.file;

  if (!file) {
    return next(new ErrorHandler("please add post ", 400));
  }

  const fileUrl = getDataUri(file);


  const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content, {
    folder: "posts"
  })


  const postData = {
    caption: req.body.caption,
    image: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url
    },
    owner: req.user.id
  }

  const post = await Post.create(postData);
  const user = await User.findById(req.user.id);
  user.posts.push(post._id);

  await user.save();


  res.status(201).json({
    success: true,
    message: "post has been created"
  })
});


exports.createVideoPost = catchAsyncErrors(async (req, res, next) => {

  const file = req.file;

  if (!file) {
    return next(new ErrorHandler("please add post ", 400));
  }

  const fileUrl = getDataUri(file);


  const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content, {
    folder: "videoPosts",
    resource_type: 'video',
  })


  const postData = {
    caption: req.body.caption,
    video: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url
    },
    isVideoPost: true,
    owner: req.user.id
  }

  const post = await Post.create(postData);
  const user = await User.findById(req.user.id);
  user.posts.push(post._id);

  await user.save();


  res.status(201).json({
    success: true,
    message: "post has been created",
    post
  })
});





exports.deletePost = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorHandler("can't find post", 404));
  }



  if (post.owner.toString() !== req.user.id.toString()) {
    return next(new ErrorHandler("unauthorised", 403));
  }


  await cloudinary.v2.uploader.destroy(post.image.public_id);

  await post.remove();

  const user = await User.findById(req.user.id);

  const index = user.posts.indexOf(req.params.id);

  user.posts.splice(index, 1);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Post has been delted"
  })
})

exports.likeAndUnlikePost = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);


  if (!post) {
    return next(new ErrorHandler("can't find post", 404));
  }

  const user = await User.findById(post.owner);
  const currentUser=await User.findById(req.user.id);

  const alreadyLIked = post.likes.includes(currentUser._id);


  if (alreadyLIked) {
    const index = post.likes.indexOf(req.user.id);
    post.likes.splice(index, 1);
    await post.save();

    res.status(200).json({
      success: true,
      message: "post unlike succesfully"
    });
  }
  else {
    post.likes.push(req.user.id);

    const notification = await Notification.create({
      user: {
        avatar: currentUser.avatar.url,
        _id: currentUser._id,
        userName: currentUser.userName
      },
      notificationMessage: "liked you're post "
    });

    user.notifications.push(notification._id);

    await post.save();
    await user.save();

    res.status(200).json({
      success: true,
      message: "post like succesfully"
    });

  }
});

exports.saveOrUnsavePost = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);


  if (!post) {
    return next(new ErrorHandler("can't find post", 404));
  }

  const user = await User.findById(post.owner);
  const currentUser = await User.findById(req.user.id);

  if (user._id.toString() === currentUser._id.toString()) {
    return next(new ErrorHandler("you can't save you're own post ", 403));
  }

  const alreadySaved = currentUser.likedPosts.includes(post._id);


  if (alreadySaved) {
    const index = currentUser.likedPosts.indexOf(post._id);
    currentUser.likedPosts.splice(index, 1);

    const indexInPost = post.postSavedBy.indexOf(currentUser._id);
    post.postSavedBy.splice(indexInPost, 1);

    await currentUser.save();
    await post.save();

    res.status(200).json({
      success: true,
      message: "post unsaved succesfully"
    });
  }
  else {
    currentUser.likedPosts.push(post._id);
    post.postSavedBy.push(currentUser._id);

    await currentUser.save();
    await post.save();

    res.status(200).json({
      success: true,
      message: "post saved succesfully"
    });

  }
});


exports.getPostOfFollowings = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const posts = await Post.find({
    owner: {
      $in: user.following
    }
  }).populate("owner likes comments.user")

  res.status(200).json({
    success: true,
    posts: posts.reverse()
  });


});

exports.updateCaption = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorHandler("can't find post ", 404));
  }

  if (post.owner.toString() !== req.user.id.toString()) {
    return next(new ErrorHandler("unauthroised", 403));
  }

  post.caption = req.body.caption;
  await post.save();

  res.status(200).json({
    success: true,
    message: "caption updated"
  })
});

exports.commentOnPost = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorHandler("can't find post ", 404));
  }

  let commentIndex = -1;

  // Checking if comment already exists

  post.comments.forEach((item, index) => {
    if (item.user.toString() === req.user.id.toString()) {
      commentIndex = index;
    }
  });

  if (commentIndex !== -1) {
    post.comments[commentIndex].comment = req.body.comment;

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Comment Updated",
    });
  } else {
    post.comments.push({
      user: req.user.id,
      comment: req.body.comment,
    });

    await post.save();
    return res.status(200).json({
      success: true,
      message: "Comment added",
    });
  }
});

exports.deleteComment = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorHandler("can't find post ", 404));
  }

  // Checking If owner wants to delete

  if (post.owner.toString() === req.user._id.toString()) {
    if (req.body.commentId === undefined) {
      return next(new ErrorHandler("Comment Id is required", 404));
    }

    post.comments.forEach((item, index) => {
      if (item._id.toString() === req.body.commentId.toString()) {
        return post.comments.splice(index, 1);
      }
    });

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Selected Comment has deleted",
    });
  } else {
    post.comments.forEach((item, index) => {
      if (item.user.toString() === req.user._id.toString()) {
        return post.comments.splice(index, 1);
      }
    });

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Your Comment has deleted",
    });
  }
});


exports.getSinglePost = catchAsyncErrors(async (req, res, next) => {

  const {postId}=req.params;

 
  const post = await Post.findById(postId).populate("owner likes comments.user");

  res.status(200).json({
    success: true,
    post,
  });
});