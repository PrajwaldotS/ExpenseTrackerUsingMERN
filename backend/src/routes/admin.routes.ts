import { Router } from "express"
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  createUser,
  updateUser
} from "../controller/admin.controller"
import { authMiddleware } from "../middleware/auth.middleware"
import { requireAdmin } from "../middleware/role.middleware"
import upload from "../middleware/upload.middleware"
import { resetUserPassword } from "../controller/admin.controller"





const router = Router()

router.put("/role", authMiddleware, requireAdmin, updateUserRole)


router.post("/create-user",authMiddleware,requireAdmin,upload.single("profilePhoto"),createUser)
router.put( "/update-user/:id", authMiddleware, requireAdmin,upload.single("profilePhoto"),updateUser)
router.delete("/delete-users/:id", authMiddleware, requireAdmin, deleteUser)
router.put("/reset-password/:id",authMiddleware,requireAdmin,resetUserPassword)

router.get("/users", authMiddleware, requireAdmin, getAllUsers)


export default router
