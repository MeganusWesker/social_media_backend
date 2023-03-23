// create and send token and save in cookie.

const sendToken = (res,user,statusCode,message)=>{
    //create jwt token

    const token = user.getJWTToken();

    // Options for cokie

    const options = {
        expires:new Date(
            Date.now() + process.env.COOKIE_EXPRIE_TIME * 24 * 60 * 60 *1000
        ),

        httpOnly:process.env.NODE_ENV==="Development" ? false:true,
        secure:process.env.NODE_ENV==="Development" ? false:true,
        sameSite:process.env.NODE_ENV==="Development" ? false:"none",
    }

    res.status(statusCode).cookie('token',token,options).json({
          success:true,
          token,
          user,
          message,
    });
}

module.exports = sendToken;