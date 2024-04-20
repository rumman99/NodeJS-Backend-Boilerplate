import { Router } from "express";
import { userLogin, userRegister } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";


const router= Router();

router.route('/register').post(upload.fields([{name: 'avatar', maxCount: 1}, {name: 'cover', maxCount: 1}]), userRegister) //added multer middleware//

router.route('/login').post(userLogin)

export default router;