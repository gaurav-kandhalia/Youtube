import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js"
import  {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
 import jwt from 'jsonwebtoken'


const generateAccessandRefreshTokens = async(userId)=>{
     const user = await findById(userId);
   const accessToken =user.generateAccessToken();
   const refreshToken = user.generateRefreshToken();

     user.refreshToken  = refreshToken;
     await user.save({validateBeforeSave:false});

     return {refreshToken,accessToken}
}
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
      throw new ApiError(400, "Avatar file is required")
  }

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
  console.log(createdUser,"..........]]")

  if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered Successfully")
  )

} )

const loginUser =  asyncHandler( async (req,res)=>{
    // take data entered by user --done
    //  operate username or email  --done
    // find the user  done
    // password check done
    // generate access and refresh token --done
    // send cookie (token) pass token

    const {username,email,password} = req.body;
if(!username || !email){
    throw new ApiError(400,"email or username is required")
}
// check if the user exists or not
const user = User.findOne({
    $or:[{username}, {email}]
});

if(!user){
    throw new ApiError(401,"Invalid user Credentials");
}

if(!password){
    throw new ApiError()
}

const isPasswordValid = user.isPasswordCorrect(password);

if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials");
}

const {accessToken,refreshToken} = await generateAccessandRefreshTokens(user._id);


const loggedInUser = await findById(user._id).select("-password -refreshToken")

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


const logoutUser = asyncHandler(async(req,res)=>{
    // cookies expire 
    
})

 

export { registerUser }