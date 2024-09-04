import dotenv from 'dotenv'
import connectDB from './db/db.js'
import {app} from './app.js'
dotenv.config({
    path: './.env'
})

connectDB()
.then(
app.listen(process.env.PORT || 5911,()=>{
    console.log("Server is listening at port",process.env.PORT)
})
).catch((err)=>{
    console.log("Database connection failed !!!!",err)
})