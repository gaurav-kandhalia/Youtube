import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import {User} from '../models/user.model'
import jwt from "jsonwebtoken"

const jwtVerify = asyncHandler(async(req,res,next)=>{

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
               
        if(!token){
            throw new ApiError(401,"unauthorized User");
        }
        // pass secret key
                const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECERET);
                     
    
                const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
                if(!user){
                    throw new ApiError(401,"Invalid Acces Token");
                }
    
                req.user = user;
                next();
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid access Token")
    }
            

})