import { Router } from "express"
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  createUser,
  updateUser,
  getDashboardSummary,
  getUserExpenseTotals,
  getCategoryReport,
  getZoneExpenseTotals,
  getUserZones,
  toggleUserZone
} from "../controller/admin.controller"
import { authMiddleware } from "../middleware/auth.middleware"
import { requireAdmin } from "../middleware/role.middleware"
import upload from "../middleware/upload.middleware"
import { resetUserPassword } from "../controller/admin.controller"





const router = Router()


router.get("/dashboard", authMiddleware, requireAdmin, getDashboardSummary)
router.put("/role", authMiddleware, requireAdmin, updateUserRole)


router.post("/create-user",authMiddleware,requireAdmin,upload.single("profilePhoto"),createUser)
router.put( "/update-user/:id", authMiddleware, requireAdmin,upload.single("profilePhoto"),updateUser)
router.delete("/delete-users/:id", authMiddleware, requireAdmin, deleteUser)
router.put("/reset-password/:id",authMiddleware,requireAdmin,resetUserPassword)

router.get("/users", authMiddleware, requireAdmin, getAllUsers)
router.get( "/reports/users", authMiddleware, requireAdmin, getUserExpenseTotals)
router.get("/reports/categories",authMiddleware, requireAdmin, getCategoryReport)
router.get("/reports/zones", authMiddleware, requireAdmin, getZoneExpenseTotals)

router.post( "/toggle-zone", authMiddleware,  requireAdmin,toggleUserZone)

router.get( "/user-zones/:userId", authMiddleware, requireAdmin,getUserZones)

export default router
