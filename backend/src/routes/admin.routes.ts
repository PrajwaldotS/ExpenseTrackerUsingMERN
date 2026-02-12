import { Router } from "express"
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  createUser,
  updateUser,
  getDashboardSummary,
  makeMeAdmin,
  getUserExpenseTotals,
  getCategoryExpenseTotals, 
  getZoneExpenseTotals
} from "../controller/admin.controller"
import { authMiddleware } from "../middleware/auth.middleware"
import { requireAdmin } from "../middleware/role.middleware"
import upload from "../middleware/upload.middleware"




const router = Router()

router.get("/users", authMiddleware, requireAdmin, getAllUsers)
router.get("/dashboard", authMiddleware, requireAdmin, getDashboardSummary)
router.put("/role", authMiddleware, requireAdmin, updateUserRole)
router.delete("/users/:id", authMiddleware, requireAdmin, deleteUser)
router.post("/make-me-admin", authMiddleware, makeMeAdmin)

router.post("/create-user",authMiddleware,requireAdmin,upload.single("profilePhoto"),createUser)
router.put( "/update-user/:id", authMiddleware, requireAdmin,updateUser)
router.get( "/reports/users", authMiddleware, requireAdmin, getUserExpenseTotals)

router.get("/reports/categories",authMiddleware, requireAdmin, getCategoryExpenseTotals)

router.get("/reports/zones", authMiddleware, requireAdmin, getZoneExpenseTotals)




export default router
