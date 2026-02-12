import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.routes"
import { authMiddleware } from "./middleware/auth.middleware"
import zoneRoutes from "./routes/zone.routes"
import categoryRoutes from "./routes/category.routes"
import expenseRoutes from "./routes/expense.routes"
import adminRoutes from "./routes/admin.routes"
import userRoutes from "./routes/user.routes"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.get("/", (req, res) => {
  res.send("Backend is alive")
})


app.use("/api/auth", authRoutes)
app.use("/api/zones", zoneRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/expenses", expenseRoutes)
app.use("/api/users", userRoutes)


app.use("/api/admin", adminRoutes)


export default app
