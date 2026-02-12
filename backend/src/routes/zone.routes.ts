import { Router } from "express"
import {
  createZone,
  getAllZones,
  assignUserToZone,
  getMyZones
} from "../controller/zone.controller"
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware"
import { requireAdmin } from "../middleware/role.middleware"
import prisma from "../config/db"


const router = Router()

router.post("/", authMiddleware, requireAdmin, createZone)
router.get("/", getAllZones)
router.post("/assign", assignUserToZone)
router.get("/me", authMiddleware, getMyZones)
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  if (req.user.role === "admin") {
    const zones = await prisma.zone.findMany({ orderBy: { name: "asc" } })
    return res.json(zones)
  }

  const userZones = await prisma.userZone.findMany({
    where: { userId: req.user.id },
    include: { zone: true }
  })

  const zones = userZones.map(z => z.zone)
  res.json(zones)
})


export default router
