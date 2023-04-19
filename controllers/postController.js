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
  const currentUser = await User.findById(req.user.id);

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

    if(user._id !==currentUser._id){
      const notification = await Notification.create({
        user: {
          avatar: currentUser.avatar.url,
          _id: currentUser._id,
          userName: currentUser.userName
        },
        isPostNotification:true,
        postId:post._id,
        notificationMessage: "liked you're post "
      });
  
      user.notifications.push(notification._id);
    }



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
  }).populate("owner likes comments.user comments.likes comments.replies.commentBy comments.replies.repliedTo comments.replies.likes")

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
  const post = await Post.findById(req.params.postId);

  if (!post) {
    return next(new ErrorHandler("can't find post ", 404));
  }

  const userThatOwnThePost = await User.findById(post.owner);
  const currentLoggedInUser = await User.findById(req.user.id);


  post.comments.push({
    user: currentLoggedInUser._id,
    comment: req.body.comment
  });

  await post.save();

  if (currentLoggedInUser._id.toString() !== userThatOwnThePost._id.toString()) {
    const notification = await Notification.create({
      user: {
        avatar: currentLoggedInUser.avatar.url,
        _id: currentLoggedInUser._id,
        userName: currentLoggedInUser.userName
      },
      notificationMessage: `commented On you're Post ${req.body.comment}`,
      isPostNotification:true,
      postId:post._id,
    });

    userThatOwnThePost.notifications.push(notification._id);

    await userThatOwnThePost.save();
  }



  return res.status(200).json({
    success: true,
    message: "Comment added",
  });

});

exports.likeCommentOnPost = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);


  if (!post) {
    return next(new ErrorHandler("can't find post ", 404));
  }


  const currentLoggedInUser = await User.findById(req.user.id);

  let likeOrUnlikeChecker = true;
  let commentMessage;
  let userWhoCommented;


  for (let i = 0; i < post.comments.length; i++) {
    if (req.params.commentId.toString() === post.comments[i]._id.toString()) {
      const alreadyLIked = post.comments[i].likes.includes(currentLoggedInUser._id);
      commentMessage=post.comments[i].comment;
      userWhoCommented = await User.findById(post.comments[i].user);

      if (!alreadyLIked) {
        post.comments[i].likes.push(currentLoggedInUser._id);
      } else {
        post.comments[i].likes = post.comments[i].likes.filter((item) => item.toString() !== currentLoggedInUser._id.toString());
        likeOrUnlikeChecker = false;
      }

    }
  }

  await post.save();


  if (likeOrUnlikeChecker) {
    if (currentLoggedInUser._id.toString() !== userWhoCommented._id.toString()) {
      const notification = await Notification.create({
        user: {
          avatar: currentLoggedInUser.avatar.url,
          _id: currentLoggedInUser._id,
          userName: currentLoggedInUser.userName
        },
        notificationMessage: `liked you're comment ${commentMessage}`,
        isPostNotification:true,
        postId:post._id,
      });

      userWhoCommented.notifications.push(notification._id);

      await userWhoCommented.save();
    }
  }

  return res.status(200).json({
    success: true,
    message: likeOrUnlikeChecker ? "comment liked successfully" : "comment unlike successfully",
    likedComment:likeOrUnlikeChecker
  });

});


exports.updateCommentOnPost = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);


  if (!post) {
    return next(new ErrorHandler("can't find post ", 404));
  }

  const currentLoggedInUser = await User.findById(req.user.id);


  for (let i = 0; i < post.comments.length; i++) {
    if (req.params.commentId.toString() === post.comments[i]._id.toString()) {


      if (currentLoggedInUser._id.toString() !== post.comments[i].user.toString()) {

        return next(new ErrorHandler("you only can edit you're on comment ", 403));
      } else {
        post.comments[i].comment = req.body.comment;
      }

    }
  }

  await post.save();

  return res.status(200).json({
    success: true,
    message: "comment edited successfully",
  });

});

exports.deleteCommentOnPost = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);


  if (!post) {
    return next(new ErrorHandler("can't find post ", 404));
  }

  const userThatOwnThePost = await User.findById(post.owner);
  const currentLoggedInUser = await User.findById(req.user.id);

  const isPostOwner = userThatOwnThePost._id.toString() === currentLoggedInUser._id.toString();

  

  for (let i = 0; i < post.comments.length; i++) {
    if (req.params.commentId.toString() === post.comments[i]._id.toString()) {

      
      if (currentLoggedInUser._id.toString() === post.comments[i].user.toString() || isPostOwner) {
        post.comments = post.comments.filter((item) => item._id.toString() !== req.params.commentId.toString());

      } else {
        return next(new ErrorHandler("you only can delete you're on comment ", 403));
      }

    }
  }

  await post.save();

  return res.status(200).json({
    success: true,
    message: "comment deleted successfully",
  });

});

exports.replyToComment = catchAsyncErrors(async (req, res, next) => {


  const post = await Post.findById(req.params.postId);

  if (!post) {
    return next(new ErrorHandler("can't find post ", 404));
  }


  const currentLoggedInUser = await User.findById(req.user.id);
  let userWhoCommented;

  for (let i = 0; i < post.comments.length; i++) {
    if (req.params.commentId.toString() === post.comments[i]._id.toString()) {
      userWhoCommented = await User.findById(post.comments[i].user);
      post.comments[i].replies.push({
        commentBy: currentLoggedInUser._id,
        repliedTo: post.comments[i].user,
        comment: req.body.comment
      })

    }
  }

  await post.save();

  if (currentLoggedInUser._id.toString() !== userWhoCommented._id.toString()) {
    const notification = await Notification.create({
      user: {
        avatar: currentLoggedInUser.avatar.url,
        _id: currentLoggedInUser._id,
        userName: currentLoggedInUser.userName
      },
      notificationMessage: `mentioned you in a comment ${req.body.comment}`,
      isPostNotification:true,
      postId:post._id,
    });

    userWhoCommented.notifications.push(notification._id);

    await userWhoCommented.save();
  }



  return res.status(200).json({
    success: true,
    message: "Comment added",
  });

});


exports.likeReply = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);


  if (!post) {
    return next(new ErrorHandler("can't find post ", 404));
  }


  const currentLoggedInUser = await User.findById(req.user.id);
  let userWhoCommented;

  let likeOrUnlikeChecker = true;
  let commentMessage;


  for (let i = 0; i < post.comments.length; i++) {
    if (req.params.commentId.toString() === post.comments[i]._id.toString()) {

      for (let j = 0; j < post.comments[i].replies.length; j++) {
        if (req.params.replyId.toString() === post.comments[i].replies[j]._id.toString()) {

          commentMessage=post.comments[i].replies[j].comment;

          userWhoCommented = await User.findById(post.comments[i].replies[j].commentBy);

          const alreadyLIked = post.comments[i].replies[j].likes.includes(currentLoggedInUser._id);

          if (!alreadyLIked) {
            post.comments[i].replies[j].likes.push(currentLoggedInUser._id);
          } else {
            post.comments[i].replies[j].likes = post.comments[i].replies[j].likes.filter((item) => item.toString() !== currentLoggedInUser._id.toString());
            likeOrUnlikeChecker = false;
          }

        }
      }

    }
  }

  await post.save();

  if (likeOrUnlikeChecker) {
    if (currentLoggedInUser._id.toString() !== userWhoCommented._id.toString()) {
      const notification = await Notification.create({
        user: {
          avatar: currentLoggedInUser.avatar.url,
          _id: currentLoggedInUser._id,
          userName: currentLoggedInUser.userName
        },
        notificationMessage: `liked you're comment ${commentMessage}`,
        isPostNotification:true,
        postId:post._id,
      });

      userWhoCommented.notifications.push(notification._id);

      await userWhoCommented.save();
    }
  }

  return res.status(200).json({
    success: true,
    message: likeOrUnlikeChecker ? "comment liked successfully" : "comment unlike successfully",
    likedReply:likeOrUnlikeChecker,
  });

});

exports.editReplyOnPost = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);


  if (!post) {
    return next(new ErrorHandler("can't find post ", 404));
  }

  const currentLoggedInUser = await User.findById(req.user.id);


  for (let i = 0; i < post.comments.length; i++) {
    if (req.params.commentId.toString() === post.comments[i]._id.toString()) {

      for (let j = 0; j < post.comments[i].replies.length; j++) {
        if (req.params.replyId.toString() === post.comments[i].replies[j]._id.toString()) {


          if (currentLoggedInUser._id.toString() !== post.comments[i].replies[j].commentBy.toString()) {

            return next(new ErrorHandler("you only can edit you're on comment ", 403));
          } else {
            post.comments[i].replies[j].comment = req.body.comment;
          }

        }
      }
    }
  }

  await post.save();

  return res.status(200).json({
    success: true,
    message: "comment edited successfully",
  });

});

exports.deleteReplyOnPost = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);


  if (!post) {
    return next(new ErrorHandler("can't find post ", 404));
  }

  const userThatOwnThePost = await User.findById(post.owner);
  const currentLoggedInUser = await User.findById(req.user.id);

  const isPostOwner = userThatOwnThePost._id.toString() === currentLoggedInUser._id.toString();

  for (let i = 0; i < post.comments.length; i++) {
    if (req.params.commentId.toString() === post.comments[i]._id.toString()) {

      const commentOnwer = post.comments[i].user.toString() === currentLoggedInUser._id.toString();

      for (let j = 0; j < post.comments[i].replies.length; j++) {

        if (req.params.replyId.toString() === post.comments[i].replies[j]._id.toString()) {

            if (currentLoggedInUser._id.toString() === post.comments[i].replies[j].commentBy.toString() || commentOnwer || isPostOwner)  {
              post.comments[i].replies = post.comments[i].replies.filter((item) => item._id.toString() !== req.params.replyId.toString());
             
            } else  {
            
              return next(new ErrorHandler("you only can delete you're on comment ", 403));
            }
        }

      }
    }
  }

  await post.save();

  return res.status(200).json({
    success: true,
    message: "comment deleted successfully",
  });

});

exports.replyToaReply = catchAsyncErrors(async (req, res, next) => {


  const post = await Post.findById(req.params.postId);

  if (!post) {
    return next(new ErrorHandler("can't find post ", 404));
  }


  const currentLoggedInUser = await User.findById(req.user.id);
  let userWhoCommented;

  for (let i = 0; i < post.comments.length; i++) {
    if (req.params.commentId.toString() === post.comments[i]._id.toString()) {

      for (let j = 0; j < post.comments[i].replies.length; j++) {

        if (req.params.replyId.toString() === post.comments[i].replies[j]._id.toString()) {

          userWhoCommented = await User.findById(post.comments[i].replies[j].commentBy);
          post.comments[i].replies.push({
            commentBy: currentLoggedInUser._id,
            repliedTo: userWhoCommented._id,
            comment: req.body.comment
          })

        }

      }

    }
  }

  await post.save();

  if (currentLoggedInUser._id.toString() !== userWhoCommented._id.toString()) {
    const notification = await Notification.create({
      user: {
        avatar: currentLoggedInUser.avatar.url,
        _id: currentLoggedInUser._id,
        userName: currentLoggedInUser.userName
      },
      notificationMessage: `mentioned you in a comment ${req.body.comment}`,
      isPostNotification:true,
      postId:post._id,
    });

    userWhoCommented.notifications.push(notification._id);

    await userWhoCommented.save();
  }

  return res.status(200).json({
    success: true,
    message: "Comment added",
  });

});


exports.getSinglePost = catchAsyncErrors(async (req, res, next) => {

  const { postId } = req.params;


  const post = await Post.findById(postId).populate("owner likes comments.user comments.likes comments.replies.commentBy comments.replies.repliedTo comments.replies.likes")

  res.status(200).json({
    success: true,
    post,
  });
});

exports.toggleNotifications = catchAsyncErrors(async (req, res, next) => { 

  const currentLoggedInUser = await User.findById(req.user.id);

  currentLoggedInUser.notifications.forEach(async(item)=>{
    const notification=await Notification.findById(item);
    notification.isNewMessage=false;
    await notification.save();
  });

  await currentLoggedInUser.save()

  res.status(200).json({
    success: true,
  });
  
});


