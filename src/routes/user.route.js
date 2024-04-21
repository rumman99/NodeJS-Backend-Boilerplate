import { Router } from "express";
import { getCurrentUser, logoutUser, refreshToken, resetPassword, updateAvatar, updateCover, updateUserInfo, userLogin, userRegister } from "../controllers/user.controller.js";
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

// Refresh Tokens end point //
router.route('/refresh-token').post(refreshToken);

// Secure Route //
router.route('/logout').post(verifyJWT, logoutUser);

router.route('/reset-password').patch(verifyJWT, resetPassword);

router.route('/current-user').get(verifyJWT, getCurrentUser);

router.route('/update-info').patch(verifyJWT, updateUserInfo);

router.route('/update-avatar').patch(verifyJWT, upload.single("avatar"), updateAvatar);

router.route('/update-cover').patch(verifyJWT, upload.single("cover"), updateCover);

export default router;