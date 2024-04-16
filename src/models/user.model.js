import {Schema, model} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema= new Schema({
        username: {
            type: String,
            required: [true, "UserName Needed!!!"],
            unique: [true, "Username Need to be Unique!!!"],
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: [true, "Email Needed!!!"],
            unique: [true, "Email Need to be Unique!!!"],
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: [true, "FullName Needed!!!"],
            trim: true,
            index: true
        },
        avatar: {
            type: String, // Cloudinary Url
            required: true,
        },
        cover: {
            type: String, // Cloudinary Url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "Password is Required!!!"]
        },
        refreshToken: {
            type: String
        }
},
    {timestamps: true}
);

// Pre Password Save Encryption //
userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        return next();
    }
    this.password= await bcrypt.hash(this.password, 10)
    next();
})

// Custom Hooks for compare with Encrypt Password //
userSchema.methods.comparePassword= async function(password){
    return await bcrypt.compare(password, this.password);
}

// Custom Hooks for Generate Access Token with Encrypt Password
userSchema.methods.generateAccessToken= function(){
    return jwt.sign({
        _id: this._id, 
        email: this.email, 
        username: this.username, 
        fullName: this.fullName
    },
        process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}

// Custom Hooks for Generate Refresh Token with Encrypt Password
userSchema.methods.generateRefreshToken= async function(){
    return jwt.sign({
        _id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export const User= model('User', userSchema);