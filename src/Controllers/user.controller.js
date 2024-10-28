import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js"
import  {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import { extractPublicId } from 'cloudinary-build-url'
 import jwt from 'jsonwebtoken'

// generate jwt token
const generateAccessandRefreshTokens = async(userId)=>{
     const user = await User.findById(userId);
   const accessToken =user.generateAccessToken();
   const refreshToken = user.generateRefreshToken();

   console.log("accessToken",accessToken);
   console.log("refreshToken",refreshToken);

     user.refreshToken  = refreshToken;
     await user.save({validateBeforeSave:false});

     return {refreshToken,accessToken}
}

// register User
const registerUser = asyncHandler(async (req, res) => {
  // take details from the user  done
  // check validation done
  // check user already exist  done
  // 
  // check validation of avatar done
  // 
  // upload to avatar and coverImage cloudinary and check done
  // create the User object - User entry in db done
  // create user done
  // remove password and refresh token done
  // return response

  const {fullname, email, username, password } = req.body


  if (
      [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
      throw new ApiError(400, "All fields are required")
  }

  const existedUser = await User.findOne({
      $or: [{ username }, { email }]
  })

  if (existedUser) {
      throw new ApiError(409, "User with email or username already exists")
  }
 

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
  }
  

  if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar localfile path is required")
  }

  console.log("avatar.local.....",avatarLocalPath)
  console.log("avatar.local.....",coverImageLocalPath)
  const avatar = await uploadOnCloudinary(avatarLocalPath)

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
      throw new ApiError(400, "Avatar file is required")
  }
 

  const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email, 
      password,
      username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
  )
  

  if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered Successfully")
  )

} )
// login user
const loginUser =  asyncHandler( async (req,res)=>{
    // take data entered by user --done
    //  operate username or email  --done
    // find the user  done
    // password check done
    // generate access and refresh token --done
    // send cookie (token) pass token

    const {username,email,password} = req.body;
    console.log("username",username)
    console.log("email",email)
    console.log("password",password)
if(!username && !email){
    throw new ApiError(400,"email or username is required")
}
// check if the user exists or not
const user = await User.findOne({
    $or:[{username}, {email}]
});



if(!user){
    throw new ApiError(401,"Invalid user Credentials");
}

if(!password){
    throw new ApiError()
}

const isPasswordValid =await user.isPasswordCorrect(password);

if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials");
}


const {accessToken,refreshToken} = await generateAccessandRefreshTokens(user._id);
console.log("accessToken",accessToken);
console.log("refreshToken",refreshToken);


const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


const options ={
    secure:true,
    httpOnly: true
}


res.
status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(new ApiResponse(200,
    {
        user:loggedInUser,accessToken,refreshToken

},
"user logged in successfully"
)
)



})


const logoutUser = asyncHandler(async(req, res) => {
    console.log("user logging out");
    
    await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: 1 }
    });

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)  
        .clearCookie("refreshToken", options)  
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async(req,res)=>{
       // fetch the refreshToken from the user cookies or body
       // then decode the token 
       // now check the decoded token is same as the stored token in the database
       // if not then unauthorised else generate acessToken

       const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
            
        if(!incomingRefreshToken){
            throw new ApiError(400,"unathorized request")
        }

    try {
           const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    
           const user = await User.findById(decodedToken?._id,_id);
    
           if(!user){
            throw new ApiError(401,"invalid refresh Token")
           }
    
           if(incomingRefreshToken !== user?.refreshToken){
       throw new ApiError(400,"Refresh token is expired or used");
           }
    
           const options ={
            secure:true,
            httpOnly: true
        }
       const {accessToken,newRefreshToken}  =  await generateAccessandRefreshTokens(user?._id);
    
       res.status(200)
       .cookie("accessToken",options)
       .cookie("newRefreshToken",options)
       .json(
        new ApiResponse(200,{
            accessToken,newRefreshToken
        },"token set again")
       )
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh Token");
    }

});


const changeCurrentPassword = asyncHandler(async(req,res)=>{
    // take new password and old password 
    // validate the old password 
    //then change the password and save it in the database

    const {oldPassword,newPassword} = req.body;
     const user = await User.findById(req.user?._id);

  const isPasswordCorrect =await isPasswordCorrect(oldPassword);
  if(!isPasswordCorrect){
    throw new ApiError(400,"your password is wrong")
  }

   user.password = newPassword;
   await user.save({validateBeforeSave:false});

   return res
   .status(200)
   .json(new ApiResponse(200,{},"password changed successfully"));
 
})

const getCurrentUser = asyncHandler(async(req,res)=>{
  // send the user in the res
  return res
  .status(200)
  .json(new ApiResponse(200,req.user,"User fetched successfully"))
})

const updatedAccountDetails = asyncHandler(async(req,res)=>{
    // get the new details from the user 
    // fetch the user and update the data of the user
    const{fullName,email} = req.body;
    if(!fullName || !email){
        throw new ApiError(400,"All fields are rerquire")
    }
    const user = await User.findById(req.user?._id,{
        $set:{
            fullName,
            email
        }
    },{
        new:true
    }).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"));
})

const updatedUserAvatar = asyncHandler(async(req,res)=>{
    // take local path of the file user want to update
    // validate the avatarLocalPath
    // delete the old image
    // upload image on the cloudinary
    // set the image url in database 
    // fetch the updated details from the database 
    // and send it as a response to the user

    // to delete the old image from the cloudinary you need to fetch the public id of the url of the image
    // fetch the url and use cloudinary destroy method to delete the image 
    

    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    // delete the old image

    const userInfo = await User.findById(req.user?._id);
    if(!userInfo){
        throw new ApiError(400,"user does not exist")
    }
    const oldAvatar = userInfo.avatar;
    if(!oldAvatar){
        throw new ApiError(400,"avatar file is missing")
    }

    

    const publicId = extractPublicId(oldAvatar) ;
    console.log("public Id is not provided")
    


   if(publicId){
    try {
        const response  = await  cloudinary.v2.uploader.destroy(publicId, options).then(callback);
        
    } catch (error) {
        throw new ApiError(404,"error while deleting the file",error)
        
    }
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findById(req.user?._id,{
       $set:{
        avatar:avatar.url
       } 
    },{new:true}).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar image updated successfully")
    )
})
 

export { registerUser , loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updatedAccountDetails,updatedUserAvatar}