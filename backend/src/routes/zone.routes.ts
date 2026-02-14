import { Router } from "express"
import {
  createZone,
  getAllZones,
  assignUserToZone,
  getMyZones,
  deleteZone
} from "../controller/zone.controller"
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware"
import { requireAdmin } from "../middleware/role.middleware"


const router = Router()

router.post("/", authMiddleware, requireAdmin, createZone)
router.get("/", getAllZones)
router.post("/assign", assignUserToZone)
router.get("/me", authMiddleware, getMyZones)
router.delete("/:id",authMiddleware,requireAdmin,deleteZone)



export default router