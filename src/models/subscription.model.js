import mongoose, {Schema} from "mongoose";

const subscriptSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

export const mongoose = new mongoose.model("Subscription",subscriptionSchema)