const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('./catchAsyncError');

exports.isAuthenticatedUser = catchAsyncErrors(async (req,res,next)=>{
   const {token} = req.cookies;

      if(!token){
          return next(new ErrorHandler('login first to acces this resource',401))
      }

      const decoded = jwt.verify(token ,process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);

      next();
});