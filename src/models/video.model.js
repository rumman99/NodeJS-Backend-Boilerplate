import {Schema, model} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema= new Schema({
        videoFile: {
            type: String, // Cloudinary Url
            required: [true, "Video must be there"]
        },
        thumbnail: {
            type: String, // Cloudinary Url
            required: [true, "Thumbnail must be there"]
        },
        title: {
            type: String,
            required: [true, "Title must be there"]
        },
        description: {
            type: String,
            required: [true, "Description must be there"]
        },
        duration: {
            type: Number, // from Cloudinary Duration
            required: [true, "duration must be there"]
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User" 
        },  
},
    {timestamps: true}
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video= model('Video', videoSchema);