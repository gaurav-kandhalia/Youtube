import mongoose, { mongo, Schema } from "mongoose";
import bcrypt, { compare } from 'bcrypt'
import jwt from "jsonwebtoken"

const userSchema = new Schema(
    {
username:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    index:true,

},
email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
   

},
fullname:{
    type:String,
    required:true,
    lowercase:true,
    trim:true,
   

},
password:{
    type:String,
    required:[true,"Password is Required"],
},
avatar:{
    type :String,
    required:true,
},
coverImage:{
    type:String,// cloudinary url

},
watchHistory:[{
    type:Schema.Types.ObjectId,
    ref:"Video"
}],
refreshToken:{
    type:String,

},

},
{
    timestamps:true
}
)



userSchema.pre("save", async function (next){
    if(!isModified("password")) return next();
    this.password = await bcrypt.hash(this.password,10);
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
  return await  bcrypt.compare(password,this.password);
}

userSchema.methods.generateAcessToken = function(){
    return jwt.sign(
        {
        _id:this._id,                     // payload
        email:this.email,
        username:this.username,
        fullname:this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,          // secret Key
    {
             expiresIn:ACCESS_TOKEN_EXPIRY      // optional expiry
    }
)
}


userSchema.methods.generatRefreshToken = function (){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:REFRESH_TOKEN_EXPIRY
    }
    )
}
 export const user = mongoose.model("User", userSchema)