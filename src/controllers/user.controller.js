import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const accessAndRefreshTokenGenerator= async(user)=>{
    const accessToken= await user.generateAccessToken()
    const refreshToken= await user.generateRefreshToken()

    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave: false})

    return {accessToken, refreshToken}
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

    if(!cloudinaryUploadAvatar){
        throw new ApiError(400, "Avatar file is Required!!!")
    }

    // Registering User after pass all requirements
    const createUser= await User.create({fullName, username: username.toLowerCase(), email, avatar: cloudinaryUploadAvatar.url, cover: cloudinaryUploadCover?.url || "", password});

    // Retrieve user after Register for more secure way
    const retrieveUserAfterRegister= await User.findById(createUser._id).select("-password, -refreshToken");

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

    const existedUser= await User.findOne({$or: [{username}, {email}]});

    if(!existedUser){
        throw new ApiError(404, "No User Found, Please Register First!!!");
    }

    const checkUserPassword= await existedUser.comparePassword(password);

    if(!checkUserPassword){
        throw new ApiError(401, "User Credential Not Match!!!");
    }

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

})

export {userRegister, userLogin, logoutUser};