import { Router } from "express"
import { authMiddleware } from "../middleware/auth.middleware"
import { requireAdmin } from "../middleware/role.middleware"
import upload from "../middleware/upload.middleware"
import { getDashboardSummary,getAllUsers , getCategoryReport,getUserReport , getZoneReport } from "../controller/Dashboard.controller"


const router = Router()

router.get("/dashboard", authMiddleware, requireAdmin, getDashboardSummary)
router.get("/users", authMiddleware, requireAdmin, getAllUsers)
router.get( "/reports/users", authMiddleware, requireAdmin, getUserReport)
router.get("/reports/categories",authMiddleware, requireAdmin, getCategoryReport)
router.get("/reports/zones", authMiddleware, requireAdmin, getZoneReport)


export default router;