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
     include: {
    creator: {
      select: {
        name: true
      }
    }
  },
  orderBy: {
    createdAt: "desc"
  }
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
export const deleteZone = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string

    if (!id) {
      return res.status(400).json({ message: "Zone ID required" })
    }

    // Optional: check if zone exists
    const existingZone = await prisma.zone.findUnique({
      where: { id }
    })

    if (!existingZone) {
      return res.status(404).json({ message: "Zone not found" })
    }

    // Remove related userZone entries first (if relation exists)
    await prisma.userZone.deleteMany({
      where: { zoneId: id }
    })

    // Remove related expenses (if needed)
    await prisma.expense.deleteMany({
      where: { zoneId: id }
    })

    // Finally delete zone
    await prisma.zone.delete({
      where: { id }
    })

    res.json({ message: "Zone deleted successfully" })

  } catch (error) {
    console.error("DELETE ZONE ERROR:", error)
    res.status(500).json({ message: "Failed to delete zone" })
  }
}

