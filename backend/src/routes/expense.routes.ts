import { Router } from "express"
import {
  createExpense,
  getMyExpenses,
  deleteExpense,
  updateExpense,
} from "../controller/expense.controller"
import { authMiddleware } from "../middleware/auth.middleware"
import upload from "../middleware/upload.middleware"
import { uploadReceipt } from "../controller/expense.controller"

const router = Router()

router.post("/", authMiddleware, createExpense)
router.get("/", authMiddleware, getMyExpenses)
router.delete("/:id", authMiddleware, deleteExpense)
router.post(  "/:id/upload-receipt", authMiddleware,upload.single("image"),uploadReceipt)
router.put("/:id", authMiddleware, updateExpense)


export default router
