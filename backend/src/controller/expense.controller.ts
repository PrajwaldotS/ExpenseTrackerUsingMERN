import { Response } from "express"
import prisma from "../config/db"
import { AuthRequest } from "../middleware/auth.middleware"
import cloudinary from "../config/cloudinary"

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, description, expenseDate, categoryId, zoneId } = req.body

    if (!amount || !categoryId || !zoneId) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const expense = await prisma.expense.create({
      data: {
        amount: Number(amount),
        description,
        expenseDate: new Date(expenseDate),
        categoryId,
        zoneId,
        userId: req.user.id
      }
    })

    res.status(201).json(expense)
  } catch (error) {
    console.error("CREATE EXPENSE ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getMyExpenses = async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader("Cache-Control", "no-store")

    const { zoneId, categoryId, page = "1", pageSize = "10", search } = req.query

    const pageNumber = Number(page)
    const size = Number(pageSize)

    const where: any = {
      userId: req.user.id
    }

    if (zoneId) where.zoneId = zoneId
    if (categoryId) where.categoryId = categoryId
    if (search) {
      where.description = {
        contains: search as string,
        mode: "insensitive"
      }
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: true,
          zone: true
        },
        orderBy: { createdAt: "desc" },
        skip: (pageNumber - 1) * size,
        take: size
      }),
      prisma.expense.count({ where })
    ])

    res.json({
      data: expenses,
      total
    })

  } catch (error) {
    console.error("GET EXPENSES ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}


export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string

    await prisma.expense.delete({
      where: { id }
    })

    res.json({ message: "Expense deleted successfully" })
  } catch (error) {
    console.error("DELETE EXPENSE ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}
export const uploadReceipt = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const expenseId = req.params.id as string

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "receipts" },
      async (error, result) => {
        if (error || !result) {
          return res.status(500).json({ message: "Upload failed" })
        }

        const updatedExpense = await prisma.expense.update({
          where: { id: expenseId },
          data: { receiptUrl: result.secure_url }
        })

        res.json({
          message: "Receipt uploaded",
          receiptUrl: updatedExpense.receiptUrl
        })
      }
    )

    uploadStream.end(req.file.buffer)

  } catch (error) {
    console.error("RECEIPT UPLOAD ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}


export const updateExpense = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.user?.id

    if (!id) {
      return res.status(400).json({ message: "Expense ID missing" })
    }

    const {
      amount,
      description,
      categoryId,
      zoneId,
      expenseDate
    } = req.body

    // 🔒 Ensure expense belongs to logged-in user (safety)
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    })

    if (!existingExpense) {
      return res.status(404).json({ message: "Expense not found" })
    }

    if (existingExpense.userId !== userId) {
      return res.status(403).json({ message: "Not authorized to update this expense" })
    }

    // ✅ Safe amount conversion
    const parsedAmount = amount ? Number(amount) : undefined

    // ✅ Safe date conversion
    let parsedDate: Date | undefined = undefined
    if (expenseDate && expenseDate !== "") {
      const tempDate = new Date(expenseDate)
      if (!isNaN(tempDate.getTime())) {
        parsedDate = tempDate
      }
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        ...(parsedAmount !== undefined && { amount: parsedAmount }),
        ...(description !== undefined && { description }),
        ...(categoryId && categoryId !== "" && { categoryId }),
        ...(zoneId && zoneId !== "" && { zoneId }),
        ...(parsedDate && { expenseDate: parsedDate })
      }
    })

    res.json(updatedExpense)

  } catch (error) {
    console.error("UPDATE EXPENSE ERROR:", error)
    res.status(500).json({ message: "Failed to update expense" })
  }
}


