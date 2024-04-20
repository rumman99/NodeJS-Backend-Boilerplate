import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken";


export const verifyJWT= asyncHandler(async(req, _, next)=>{
    try {
        // getting token from header or cookie //
        const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token){
            throw new ApiError(401, "Unauthorize Request");
        }

        // Decoded Token //
        const decode= jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Find user from decoded token's id //
        const user= await User.findById(decode?._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError(401, "Unauthorize Request");
        }

    // Set find user value to req.user //
        req.user= user;
        next();
    
    } catch (error) {
        throw new ApiError(401, "Invalid access token");
    }
})