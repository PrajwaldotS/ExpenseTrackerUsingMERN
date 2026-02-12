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
    const { zoneId, categoryId } = req.query

    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.user.id,
        zoneId: zoneId as string | undefined,
        categoryId: categoryId as string | undefined
      },
      include: {
        category: true,
        zone: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.json(expenses)
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
    const  id  = req.params.id as string
    const {
      amount,
      description,
      categoryId,
      zoneId,
      expenseDate
    } = req.body

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        amount,
        description,
        categoryId,
        zoneId,
        expenseDate
      }
    })

    res.json(updatedExpense)
  } catch (error) {
    res.status(500).json({ message: "Failed to update expense" })
  }
}


