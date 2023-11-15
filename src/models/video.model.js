import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const VideoSchema = new mongoose.Schema(
    {
        videoFile: {
            type:String,   //cloudnary url
            required:true,
        },
        thumbnail: {
            type:String,  //cloudnary url
            required:true,
        },
        title: {
            type:String,
            required:true,
        },
        description: {
            type:String,
            required:true,
        }, 
        duration: {
            type:Number,  //cloudnary url
            required:true,
        },
        views: {
            type:Number,
            default: 0
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        owner: {
            type:mongoose.Schema.Types.ObjectId,
            ref: "User",
            required:ture
        }
    },
    {
        timestamps:true
    }
)

VideoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", VideoSchema)