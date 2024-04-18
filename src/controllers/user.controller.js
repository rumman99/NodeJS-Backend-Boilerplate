import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler"
import { uploadOnCloudinary } from "../utils/cloudinary";


const userRegister= asyncHandler(async(req, res)=>{

    const {username, email, fullName, password}= req.body;

    if([username, email, fullName, password].some(field=> field?.trim() === "")){
        throw new ApiError(400, 'All Field are Required!!!');
    }

    const existUser= await User.findOne({$or: [{username, $options: i}, {email, $options: i}]})

    if(existUser){
        throw new ApiError(409, "Email or Username Already Exist!!!")
    }

    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverLocalPath= req.files?.cover[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is Required!!!")
    }

    const cloudinaryUploadAvatar= await uploadOnCloudinary(avatarLocalPath);
    const cloudinaryUploadCover= await uploadOnCloudinary(coverLocalPath);

    if(!cloudinaryUploadAvatar){
        throw new ApiError(400, "Avatar file is Required!!!")
    }

    const createUser= await User.create({fullName, username: username.toLowerCase(), email, avatar: cloudinaryUploadAvatar.url, cover: cloudinaryUploadCover?.url || "", password});

    const retriveUserAfterRegister= await User.findById(createUser._id).select("-password, -refreshToken");

    if(retriveUserAfterRegister){
        return res.status(201).json(new ApiResponse(200, retriveUserAfterRegister, "New User Created Successfully"));
    }
    else{
        throw new ApiError(500, "Something Went Wrong When Registering the User!!!!")
    }
});

export {userRegister};