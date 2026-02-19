import { Response } from "express"
import prisma from "../config/db"
import { AuthRequest } from "../middleware/auth.middleware"
import { Router } from "express"

const router = Router()

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

export const getUserReport = async (req: AuthRequest, res: Response) => {
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

export const getZoneReport = async (req: AuthRequest, res: Response) => {
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

