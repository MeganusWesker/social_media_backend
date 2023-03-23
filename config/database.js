const mongoose = require('mongoose');


const connectDataBase = ()=>{
    mongoose.set('strictQuery', false);
    mongoose.connect(process.env.MONGODB_URI,{

    }).then(con=>
        console.log(`Mongoose connected with Database on Host:${con.connection.host}`)
    ).catch(error=>
        console.log(error.message)
    )
}

module.exports =connectDataBase;