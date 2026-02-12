import { Response } from "express"
import prisma from "../config/db"
import { AuthRequest } from "../middleware/auth.middleware"
import bcrypt from "bcrypt"
import { v2 as cloudinary } from "cloudinary"

export const getAllUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.json(users)
  } catch (error) {
    console.error("GET USERS ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, role } = req.body

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role }
    })

    res.json(updatedUser)
  } catch (error) {
    console.error("UPDATE ROLE ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string

    await prisma.user.delete({
      where: { id }
    })

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("DELETE USER ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}
export const getDashboardSummary = async (_req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count()
    const totalZones = await prisma.zone.count()
    const totalCategories = await prisma.category.count()
    const totalExpenses = await prisma.expense.count()

    const totalAmountAgg = await prisma.expense.aggregate({
      _sum: {
        amount: true
      }
    })

    const totalAmount = totalAmountAgg._sum.amount || 0

    // Zone-wise totals
    const zoneWiseTotals = await prisma.expense.groupBy({
      by: ["zoneId"],
      _sum: {
        amount: true
      }
    })

    // Category-wise totals
    const categoryWiseTotals = await prisma.expense.groupBy({
      by: ["categoryId"],
      _sum: {
        amount: true
      }
    })

    res.json({
      totalUsers,
      totalZones,
      totalCategories,
      totalExpenses,
      totalAmount,
      zoneWiseTotals,
      categoryWiseTotals
    })

  } catch (error) {
    console.error("DASHBOARD ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}
export const makeMeAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { role: "admin" }
    })

    res.json({ message: "You are now admin", updatedUser })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error updating role" })
  }
}

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, phone, dob, gender } = req.body

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser)
      return res.status(400).json({ message: "User already exists" })

    const hashedPassword = await bcrypt.hash(password, 10)

    let imageUrl = null

    if (req.file ) {
      const file = req.file
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "profile-photos" },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(file.buffer)
      })

      imageUrl = result.secure_url
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        dob: dob ? new Date(dob) : null,
        gender,
        image: imageUrl
      }
    })

    res.status(201).json(user)
  } catch (error: any) {
  console.error("CREATE USER ERROR:", error)
  res.status(500).json({ message: error?.message || "Something went wrong" })
}
}

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, role } = req.body

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        role
      }
    })

    res.json(updatedUser)
  } catch (error) {
    res.status(500).json({ message: "Failed to update user" })
  }
}
export const getUserExpenseTotals = async (req: AuthRequest, res: Response) => {
  try {
    const totals = await prisma.expense.groupBy({
      by: ["userId"],
      _sum: {
        amount: true
      }
    })

    res.json(totals)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user totals" })
  }
}
export const getCategoryExpenseTotals = async (req: AuthRequest, res: Response) => {
  try {
    const totals = await prisma.expense.groupBy({
      by: ["categoryId"],
      _sum: {
        amount: true
      }
    })

    res.json(totals)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch category totals" })
  }
}
export const getZoneExpenseTotals = async (req: AuthRequest, res: Response) => {
  try {
    const totals = await prisma.expense.groupBy({
      by: ["zoneId"],
      _sum: {
        amount: true
      }
    })

    res.json(totals)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch zone totals" })
  }
}

