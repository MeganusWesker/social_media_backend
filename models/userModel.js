const mongoose = require('mongoose');
const  validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'please enter your name'],
    },
    email:{
        type:String,
        required:[true,'please enter your email'],
        unique:true,
        validate: [validator.isEmail,'please enter valid email address']
    },

    bio:{
        type:String,
    },

    newMessage:{
        type:Boolean,
        default:false,
    },

    userName:{
        type:String,
        required:[true,'please enter your email'],
        unique:[true,'username Should be true'],
    },

    password:{
        type:String,
        required:[true,'please enter your passowrd'],
        minlength:[6,'your password must be longer than 6 characeters'],
        select:false
        
    },

    avatar:{
        public_id:{
            type:String,
           
        },
        url:{
            type:String,
        }
    },
 
    posts:[
        {
           type:mongoose.Schema.Types.ObjectId,
           ref:"Post",
        }
    ],

    likedPosts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Post",
         }
    ],

    followers:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
         }
    ],

    following:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
         }
    ],

    notifications:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Notification",
         }
    ],

    verified:{
        type:Boolean,
        default:false
      },
 
     otp:Number,
     otp_expire:Date,


    createdAt:{
        type:Date,
        default:Date.now
    },
});


userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        next();
    }
     this.password = await bcrypt.hash(this.password,10);
 });
 
 // jwt token 
 
 userSchema.methods.getJWTToken = function(){
     return jwt.sign({id:this._id},process.env.JWT_SECRET,{
         expiresIn:process.env.JWT_EXPIRE,
     });
 }
 
 // password comparer
 userSchema.methods.comparePassword = async function(enteredPassword){
     return await bcrypt.compare(enteredPassword,this.password);
 }
 
 // generating passowrd
 
 userSchema.methods.getResetPasswordToken = function (){
     // Generating token 
     const resetToken = crypto.randomBytes(20).toString('hex');
 
     // hashin and adding to USerSchema 
 
     this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
 
     this.resetPasswordExprie = Date.now() + 15 * 60 * 1000;
 
     return resetToken;
 }
 
 // genrating token to verify user email
 
 userSchema.methods.verifyEmail = function (){
     // Generating token 
     const resetToken = crypto.randomBytes(20).toString('hex');
 
     // hashin and adding to USerSchema 
 
     this.verifyEmailToken = crypto.createHash('sha256').update(resetToken).digest('hex');
 
     this.verfiyEmailExpire = Date.now() + 15 * 60 * 1000;
 
     return resetToken;
 }

module.exports= mongoose.model("User",userSchema)