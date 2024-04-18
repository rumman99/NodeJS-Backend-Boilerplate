import { Router } from "express";
import { userRegister } from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";


const router= Router();

router.route('/register').post(upload.fields([{name: 'avatar', maxCount: 1}, {name: 'cover', maxCount: 1}]), userRegister) //added multer middleware//

export default router;