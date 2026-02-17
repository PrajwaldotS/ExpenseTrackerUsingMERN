import { Response } from "express"
import prisma from "../config/db"
import { AuthRequest } from "../middleware/auth.middleware"
import bcrypt from "bcrypt"
import { v2 as cloudinary } from "cloudinary"

export const getAllUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        zones: {
          include: {
            zone: true
          }
        }
      }
    })

    const formattedUsers = users.map((uz) => ({
      id: uz.id,
      name: uz.name,
      email: uz.email,
      role: uz.role,

      // Match frontend field names
      dob: uz.dob || null,
      created_at: uz.createdAt,

      profile_photo_url: uz.image || null,

      // Join zone names into comma string
      zone_names: uz.zones
        .map((uz) => uz.zone.name)
        .join(","),

    }))

    res.json(formattedUsers)

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

    const {
      name,
      email,
      dob,
      id_proof_type,
      role,
      status
    } = req.body

    let imageUrl: string | undefined

    if (req.file) {
      // if using cloudinary or local upload
      imageUrl = `/uploads/${req.file.filename}` // adjust if using cloudinary
    }

    const updatedUser = await prisma.user.update({
      
      where: { id },
      data: {
        name,
        email,
        dob: dob ? new Date(dob) : null,
        idProofType: id_proof_type,
        role,
        image: imageUrl,
        
      }
    })

    res.json(updatedUser)
    console.log("Updated user:", updatedUser)


  } catch (error) {
    console.error("UPDATE USER ERROR:", error)
    res.status(500).json({ message: "Failed to update user" })
  }
}

export const getUserExpenseTotals = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1
    const pageSize = Number(req.query.pageSize) || 5
    const search = (req.query.search as string) || ""

    const skip = (page - 1) * pageSize

    // Get all users (so users with 0 expenses are also shown)
    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive"
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    // Get grouped expense data
    const groupedExpenses = await prisma.expense.groupBy({
      by: ["userId"],
      _sum: {
        amount: true
      },
      _max: {
        expenseDate: true
      }
    })

    // Convert grouped array to map for quick lookup
    const expenseMap = new Map()

    groupedExpenses.forEach(g => {
      expenseMap.set(g.userId, {
        totalAmount: g._sum.amount || 0,
        lastExpenseDate: g._max.expenseDate || null
      })
    })

    // Merge users with expense data
    const merged = users.map(user => {
      const expenseData = expenseMap.get(user.id)

      return {
        userId: user.id,
        userName: user.name || user.email,
        totalAmount: expenseData?.totalAmount || 0,
        lastExpenseDate: expenseData?.lastExpenseDate || null
      }
    })

    // Total platform expense
    const totalPlatformExpense = merged.reduce(
      (sum, u) => sum + u.totalAmount,
      0
    )

    // Pagination
    const totalPages = Math.ceil(merged.length / pageSize)
    const paginated = merged.slice(skip, skip + pageSize)

    res.json({
      data: paginated,
      totalPlatformExpense,
      totalPages
    })

  } catch (error) {
    console.error("USER REPORT ERROR:", error)
    res.status(500).json({ message: "Failed to fetch user totals" })
  }
}


export const getCategoryReport = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1
    const pageSize = Number(req.query.pageSize) || 5
    const search = (req.query.search as string) || ""

    const skip = (page - 1) * pageSize

    // Get grouped expense data
    const grouped = await prisma.expense.groupBy({
      by: ["categoryId"],
      _sum: {
        amount: true
      },
      _max: {
        expenseDate: true
      }
    })

    // Fetch category details
    const categories = await prisma.category.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive"
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    // Create map for quick lookup
    const expenseMap = new Map()

    grouped.forEach(g => {
      expenseMap.set(g.categoryId, {
        total: g._sum.amount || 0,
        lastExpenseDate: g._max.expenseDate || null
      })
    })

    // Merge category + expense data
    const merged = categories.map(cat => {
      const expenseData = expenseMap.get(cat.id)

      return {
        category_id: cat.id,
        name: cat.name,
        total: expenseData?.total || 0,
        last_expense_date: expenseData?.lastExpenseDate || null
      }
    })

    const totalPlatformExpense = merged.reduce(
      (sum, c) => sum + c.total,
      0
    )

    const totalPages = Math.ceil(merged.length / pageSize)
    const paginated = merged.slice(skip, skip + pageSize)

    res.json({
      data: paginated,
      totalPlatformExpense,
      totalPages
    })

  } catch (error) {
    console.error("CATEGORY REPORT ERROR:", error)
    res.status(500).json({ message: "Failed to fetch category report" })
  }
}

export const getZoneExpenseTotals = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1
    const pageSize = Number(req.query.pageSize) || 5
    const search = (req.query.search as string) || ""

    const skip = (page - 1) * pageSize

    // Get all zones (search filter)
    const zones = await prisma.zone.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive"
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Group expenses
    const grouped = await prisma.expense.groupBy({
      by: ["zoneId"],
      _sum: { amount: true },
      _count: { id: true }
    })

    // Create lookup map
    const expenseMap = new Map()

    grouped.forEach(g => {
      expenseMap.set(g.zoneId, {
        total_expenses: g._sum.amount || 0,
        expense_count: g._count.id || 0
      })
    })

    // Merge zone + expense data
    const merged = zones.map(zone => {
      const expenseData = expenseMap.get(zone.id)

      return {
        id: zone.id,
        name: zone.name,
        created_at: zone.createdAt,
        created_by: zone.creator?.name || zone.creator?.email || "—",
        total_expenses: expenseData?.total_expenses || 0,
        expense_count: expenseData?.expense_count || 0
      }
    })

    const totalPages = Math.ceil(merged.length / pageSize)
    const paginated = merged.slice(skip, skip + pageSize)

    res.json({
      data: paginated,
      totalPages
    })

  } catch (error) {
    console.error("ZONE REPORT ERROR:", error)
    res.status(500).json({ message: "Failed to fetch zone totals" })
  }
}

export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { newPassword } = req.body

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    })

    res.json({ message: "Password reset successfully" })

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error)
    res.status(500).json({ message: "Failed to reset password" })
  }
}

export const toggleUserZone = async (req: AuthRequest, res: Response) => {

  try {
    const { userId, zoneId } = req.body

    if (!userId || !zoneId) {
      return res.status(400).json({ message: "Missing userId or zoneId" })
    }

    const existing = await prisma.userZone.findUnique({
      where: {
        userId_zoneId: {
          userId,
          zoneId
        }
      }
    })

    if (existing) {
      // Remove zone
      await prisma.userZone.delete({
        where: {
          userId_zoneId: {
            userId,
            zoneId
          }
        }
      })

      return res.json({ message: "Zone removed from user" })
    }

    // Assign zone
    await prisma.userZone.create({
      data: {
        userId,
        zoneId
      }
    })

    res.json({ message: "Zone assigned to user" })

  } catch (error) {
    console.error("TOGGLE USER ZONE ERROR:", error)
    res.status(500).json({ message: "Failed to toggle zone" })
  }
}
export const getUserZones = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string

    const zones = await prisma.userZone.findMany({
      where: { userId },
      select: {
        zoneId: true
      }
    })

    const zoneIds = zones.map(z => z.zoneId)

    res.json(zoneIds)

  } catch (error) {
    console.error("GET USER ZONES ERROR:", error)
    res.status(500).json({ message: "Failed to fetch user zones" })
  }
}
