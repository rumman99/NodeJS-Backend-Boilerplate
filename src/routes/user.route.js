import { Router } from "express";
import { logoutUser, refreshToken, userLogin, userRegister } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router= Router();

router.route('/register').post(
    //added multer middleware//
    upload.fields([
        {
            name: 'avatar', maxCount: 1
        }, 
        {
            name: 'cover', maxCount: 1
        }
    ]), 
    userRegister);

router.route('/login').post(userLogin);

// Refresh Token end point //
router.route('refresh-token').post(refreshToken);

// Secure Route //
router.route('/logout').post(verifyJWT, logoutUser);

export default router;