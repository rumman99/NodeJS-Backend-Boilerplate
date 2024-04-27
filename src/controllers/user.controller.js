import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { imageDeleteFromCloudinaryServer } from "../utils/imageDeleteFromCloudinaryServer.js";


// This Function will generate Tokens from User Model and added Refresh Token to DB //
const accessAndRefreshTokenGenerator= async(user)=>{
    try {
        const accessToken= await user.generateAccessToken();
        const refreshToken= await user.generateRefreshToken();
    
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave: false})
    
        return {accessToken, refreshToken}
    } 
    catch (error) {
        throw new ApiError(500, 'Something went wrong while generating refresh and access token');
    }
}

// REGISTRATION //
const userRegister= asyncHandler(async(req, res)=>{

    const {username, email, fullName, password}= req.body;

    // Empty Validation Check
    if([username, email, fullName, password].some(field=> field?.trim() === "")){
        throw new ApiError(400, 'All Field are Required!!!');
    }

    // Existing User or not
    const existUser= await User.findOne({$or: [{username}, {email}]})

    if(existUser){
        throw new ApiError(409, "Email or Username Already Exist!!!")
    }

    // File upload with multer and taking server local path
    const avatarLocalPath= req.files?.avatar[0]?.path;
    let coverLocalPath;

    // set image in cover if available else set= ""
    if(req.files && req.files.cover){
        coverLocalPath= req.files.cover[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is Required!!!")
    }

    // file uploading in Cloudinary Server and getting url
    const cloudinaryUploadAvatar= await uploadOnCloudinary(avatarLocalPath);

    const cloudinaryUploadCover= await uploadOnCloudinary(coverLocalPath);

    if(!cloudinaryUploadAvatar.url){
        throw new ApiError(400, "Avatar file is Required!!!")
    }

    // Registering User after pass all requirements
    const createUser= await User.create({fullName, username: username.toLowerCase(), email, avatar: cloudinaryUploadAvatar.url, cover: cloudinaryUploadCover?.url || "", password});

    // Retrieve user after Register for more secure way
    const retrieveUserAfterRegister= await User.findById(createUser._id).select("-password, -refreshToken");

    // Sending Response //
    if(retrieveUserAfterRegister){
        return res.status(201).json(new ApiResponse(200, retrieveUserAfterRegister, "New User Created Successfully"));
    }
    else{
        throw new ApiError(500, "Something Went Wrong When Registering the User!!!!")
    }
});


// LOGIN //
const userLogin= asyncHandler(async(req, res)=>{
    const {username, email, password}= req.body;

    if(!username || !email || !password){
        throw new ApiError(400, "All Field must be Required!!!");
    }

    // find user from db with username or email
    const existedUser= await User.findOne({$or: [{username}, {email}]});

    if(!existedUser){
        throw new ApiError(404, "No User Found, Please Register First!!!");
    }

    // Comparing password with decoded password in DB
    const checkUserPassword= await existedUser.comparePassword(password);

    if(!checkUserPassword){
        throw new ApiError(401, "User Credential Not Match!!!");
    }

    // Destructure Tokens from Token Generate Function //
    const {accessToken, refreshToken}= await accessAndRefreshTokenGenerator(existedUser);

    // Finding user with updated tokens //
    const loggedInUser= await User.findOne(existedUser._id).select("-password -refreshToken")

    // Cookie Options for Security //
    const options= {
        httpOnly: true,
        secure: true
    }

    // Sending Response with status, cookie and login user Data //
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
                200, 
                {
                    user: loggedInUser, accessToken, refreshToken
                }, 
                "Login Successfully!!!"
        ))
})

// LOGOUT //
const logoutUser= asyncHandler(async(req, res)=> {
    // Find and remove DB refreshToken with undefined when login //
    await User.findByIdAndUpdate(req.user._id, {$set: {refreshToken: undefined}}, {new: true})

    // Cookie Options for Security //
    const options= {
        httpOnly: true,
        secure: true
    }

    // Remove cookie and send response //
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out!!!"))
})

// Refresh and ReGenerate Access and Refresh Token //
const refreshToken= asyncHandler(async(req, res)=>{
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request");
    }

    try {
        const decode= jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user= await User.findById(decode?._id);

        if(!user){
            throw new ApiError(401, "unauthorized request");
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const {accessToken, refreshToken}= await accessAndRefreshTokenGenerator(user);

        return res
        .status(200)
        .cookie('accessToken', accessToken, {httpOnly:true, secure:true})
        .cookie('refreshToken', refreshToken, {httpOnly:true, secure:true})
        .json(new ApiResponse(200, {accessToken, refreshToken}, "Token Refreshed!!!"))
    }
    catch (error) {
        throw new ApiError(401, "unauthorized request");
    }
})

// Reset User Password //
const resetPassword= asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword}= req.body;

    if(!oldPassword || !newPassword){
        throw new ApiError(404, "Password field can't be empty!!!")
    } 

    const user= await User.findById(req.user?._id);

    const comparePassword= await user.comparePassword(oldPassword);

    if(!comparePassword){
        throw new ApiError(400, "Invalid Old Password");
    }

    // Modify old password with new password
    user.password= newPassword;

    // sending new password to DB //
    await user.save({validateBeforeSave: false});

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password Changed Successfully!!!"))
});

// Get Current Login User //
const getCurrentUser= asyncHandler(async(req, res)=>{
    return res
        .status(200)
        .json(new ApiResponse(200, {user: req.user}, "LoggedIn User Retrieve Successfully"));
});

// Update User Information(fullName, email, username) //
const updateUserInfo= asyncHandler(async(req, res)=> {
    const {username, fullName, email}= req.body;

    if(!username || !fullName || !email){
        throw new ApiError(404, "Field Can't be Empty"); 
    }

    const user= await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {
                username, 
                fullName:fullName, 
                email
            }
        }, 
        {new: true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, {user:user}, "Update Successfully!!!"))
});

// Update User Avatar //
const updateAvatar= asyncHandler(async(req, res)=> {
    const avatarLocalPath= req.file?.path;
    
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar File Missing!!!");
    }

    // Upload New image on Cloudinary //
    const newAvatar= await uploadOnCloudinary(avatarLocalPath);

    if(!newAvatar.url){
        throw new ApiError(400, "Error Uploading Avatar on Cloudinary");
    };

    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {$set: {avatar: newAvatar.url}},
        {new: true}
    ).select("-password -refreshToken");

    // Extracting Public_id and remove image from cloudinary server also //
    imageDeleteFromCloudinaryServer(req.user.avatar);

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar Updated"));
});

// Update User Cover Image //
const updateCover=asyncHandler(async(req, res)=>{
    const coverLocalPath= req.file?.path;

    if(!coverLocalPath){
        throw new ApiError(400, "Cover File Missing!!!");
    }

    // Upload New Cover on Cloudinary //
    const newCover= await uploadOnCloudinary(coverLocalPath);

    if(!newCover.url){
        throw new ApiError(400, "Error Uploading Cover on Cloudinary");
    };

    const user= await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                cover: newCover.url
            }
        },
        {new: true}
    ).select("-password -refreshToken");

    // Extracting Public_id and remove image from cloudinary server also //
    imageDeleteFromCloudinaryServer(req.user.cover);

    return res
        .status(200)
        .json(new ApiResponse(200, {user: user}, "Cover Updated"));
});

// Getting User Channel Profile //
const userChannelProfile=asyncHandler(async(req, res)=> {
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400, "Username Not Found!!!")
    }

    const channel= await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribeTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribeToCount: {
                    $size: "subscribeTo"
                },
                isSubscribe: {
                    $cond: {
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                email: 1, 
                fullName: 1,
                subscribersCount: 1,
                subscribeToCount: 1,
                isSubscribe: 1,
                avatar: 1,
                cover: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel Not Found!!!");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel Fetched Success!"))
});


export { userRegister, userLogin, logoutUser, refreshToken, resetPassword, getCurrentUser, updateUserInfo, updateAvatar, updateCover, userChannelProfile };