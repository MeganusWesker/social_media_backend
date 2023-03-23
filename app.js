const express = require('express');
const app = express();
const cookiparser = require('cookie-parser');
const errorMidleware = require('./middlewares/error')
const cors =require('cors');

// dotenv importing here 
if(process.env.NODE_ENV!=="Production"){
    require('dotenv').config({path:"config/config.env"});
}

// using middleware like cookiparser bodyparser etc..
//pp.use(express.json({limit: '50mb'}));// if we do not set this i this limit it will set limit to 1 mb which some time give error
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookiparser());

app.use(
        cors({
        origin:[process.env.FRONTEND_URL1,process.env.FRONTEND_URL2],
        credential:true,
        methods: ["GET", "POST", "PUT", "DELETE"],
    })
);


// importing routes 
const posts = require('./routes/postRoutes');
const users = require('./routes/userRoutes');
const chats = require('./routes/chatRoute');


// using routes 
app.use('/api/v1',posts);
app.use('/api/v1',users);
app.use('/api/v1',chats);

app.get('/',(req,res)=>{
    res.send('working');
})




// using error middleware for handlin errors 
app.use(errorMidleware);
module.exports = app;