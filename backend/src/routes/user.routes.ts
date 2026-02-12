import { Router } from "express"
import { authMiddleware } from "../middleware/auth.middleware"
import upload from "../middleware/upload.middleware"
import { getMe, getUserDashboard, updateProfileImage, uploadProfilePicture } from "../controller/user.controller"
import { getAllUsers } from "../controller/admin.controller"

const router = Router()

router.post("/upload-profile",authMiddleware,upload.single("image"),uploadProfilePicture)
router.put("/profile-image", authMiddleware,upload.single("image"),updateProfileImage)
router.get('/me', authMiddleware, getMe)
router.get('/dashboard', authMiddleware, getUserDashboard)
router.get('/', authMiddleware, getAllUsers)



export default router
