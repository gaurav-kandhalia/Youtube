import express from 'express'
import cookieParser from 'cookie-parser';
import cors from 'cors'
const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}))
app.use(cookieParser())
app.use(express.json({limit:"16kb"}));
app.use(express.static("public"));
app.use(express.urlencoded({
    limit:"16kb",
    extended:true
}))

import userRouter from './Routes/user.router.js'

app.use("/api/v1/users",userRouter);




export {app}