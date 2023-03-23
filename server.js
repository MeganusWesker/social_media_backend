const app = require('./app');
const connectDataBase = require('./config/database');
const cloudinary = require("cloudinary");


// connecting to database function
connectDataBase();

cloudinary.config({
     cloud_name:process.env.CLOUDINARY_NAME,
     api_key:process.env.API_KEY,
     api_secert:process.env.API_SECRET,
     cloudinary_url:process.env.CLOUDINARY_URL
});




app.listen(process.env.PORT,()=>{
     console.log(`Server started  on port ${process.env.PORT} on ${process.env.NODE_ENV} mode`)
});