import { Response } from "express"
import prisma from "../config/db"
import cloudinary from "../config/cloudinary"
import { AuthRequest } from "../middleware/auth.middleware"


export const getAllCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        expenses: true,
        creator: {   // make sure relation name matches your schema
          select: {
            name: true
          }
        }
      }
    })

    const formatted = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      createdAt: cat.createdAt,
      createdBy: cat.creator?.name || "—",
      totalExpense: cat.expenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      )
    }))

    res.json(formatted)
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error)
    res.status(500).json({ message: "Failed to fetch categories" })
  }
}
