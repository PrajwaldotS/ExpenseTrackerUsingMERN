import { Request, Response } from "express"
import prisma from "../config/db"
import { AuthRequest } from "../middleware/auth.middleware"

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ message: "Category name required" })
    }

    const existing = await prisma.category.findUnique({
      where: { name }
    })

    if (existing) {
      return res.status(400).json({ message: "Category already exists" })
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        createdBy: req.user.id
      }
    })

    res.status(201).json(category)
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getAllCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" }
    })

    res.json(categories)
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const updateCategory = async (req: Request, res: Response) => {
  try {
   const id = req.params.id as string

    const { name, description } = req.body

    const category = await prisma.category.update({
      where: { id },
      data: { name, description }
    })

    res.json(category)
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    await prisma.category.delete({
      where: { id }
    })

    res.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}
