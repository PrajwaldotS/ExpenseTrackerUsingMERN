import { Router } from "express"
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getCategories
} from "../controller/category.controller"
import { authMiddleware } from "../middleware/auth.middleware"
import { requireAdmin } from "../middleware/role.middleware"
import prisma from "../config/db"

const router = Router()

router.post("/", authMiddleware, createCategory , requireAdmin)
router.get("/", authMiddleware, getCategories)
router.put("/:id", authMiddleware, updateCategory)
router.delete("/:id", authMiddleware, deleteCategory)
router.get("/categories-summary", authMiddleware, requireAdmin, async (req, res) => {
  const categories = await prisma.category.findMany({
    include: {
      expenses: true,
      creator: {      // relation from schema
        select: {
          name: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const result = categories.map(c => ({
    id: c.id,
    name: c.name,
    created_by: c.creator?.name || "—",  
    created_at: c.createdAt,
    total_expense: c.expenses.reduce((sum, e) => sum + e.amount, 0)
  }))

  res.json(result)
})



export default router
