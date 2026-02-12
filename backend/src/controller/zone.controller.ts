import { Request, Response } from "express"
import prisma from "../config/db"
import { AuthRequest } from "../middleware/auth.middleware"

export const createZone = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ message: "Zone name required" })
    }

    const zone = await prisma.zone.create({
      data: {
        name,
        createdBy: req.user.id
      }
    })

    res.status(201).json(zone)
  } catch (error) {
    console.error("CREATE ZONE ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getAllZones = async (_req: Request, res: Response) => {
  try {
    const zones = await prisma.zone.findMany({
      orderBy: { createdAt: "desc" }
    })

    res.json(zones)
  } catch (error) {
    console.error("GET ZONES ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const assignUserToZone = async (req: Request, res: Response) => {
  try {
    const { userId, zoneId } = req.body

    const userZone = await prisma.userZone.create({
      data: {
        userId,
        zoneId
      }
    })

    res.status(201).json(userZone)
  } catch (error) {
    console.error("ASSIGN ZONE ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getMyZones = async (req: AuthRequest, res: Response) => {
  try {
    const zones = await prisma.userZone.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        zone: true
      }
    })

    res.json(zones)
  } catch (error) {
    console.error("MY ZONES ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}
