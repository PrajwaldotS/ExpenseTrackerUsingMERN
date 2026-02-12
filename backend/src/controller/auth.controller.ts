import { Request, Response } from "express"
import prisma from "../config/db"
import { hashPassword, comparePassword } from "../utils/hashPassword"
import { generateToken } from "../utils/genrateToken"

export const signup = async (req: Request, res: Response) => {
    console.log("LOGIN ROUTE HIT")

  try {
    const { email, password, name } = req.body

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    const hashed = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name
      }
    })

   const token = generateToken(user.id, user.role)

 const { password: _, ...safeUser } = user  
res.status(201).json({ token, user: safeUser })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isMatch = await comparePassword(password, user.password)

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = generateToken(user.id, user.role)


    res.json({ token, user })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
}
