import { Response } from "express"
import prisma from "../config/db"
import cloudinary from "../config/cloudinary"
import { AuthRequest } from "../middleware/auth.middleware"

export const uploadProfilePicture = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const result = await cloudinary.uploader.upload_stream(
      { folder: "profiles" },
      async (error, result) => {
        if (error || !result) {
          return res.status(500).json({ message: "Upload failed" })
        }

        const updatedUser = await prisma.user.update({
          where: { id: req.user.id },
          data: { profilePhoto: result.secure_url }
        })

        res.json({
          message: "Profile picture uploaded",
          profilePhoto: updatedUser.profilePhoto
        })
      }
    )

    result.end(req.file.buffer)

  } catch (error) {
    console.error("PROFILE UPLOAD ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}
export const updateProfileImage = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    // 1️⃣ Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    })

    // 2️⃣ Upload new image to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "profiles" },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      stream.end(req.file!.buffer)
    })

    // 3️⃣ Delete old image from Cloudinary (if exists)
    if (user?.profilePhoto) {
      const publicId = user.profilePhoto
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0]

      await cloudinary.uploader.destroy(publicId)
    }

    // 4️⃣ Update DB
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePhoto: uploadResult.secure_url }
    })

    res.json({
      message: "Profile image updated successfully",
      profilePhoto: updatedUser.profilePhoto
    })

  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}
export const getMe = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      profilePhoto: true
    }
  })

  res.json(user)
}
export const getUserDashboard = async (req: AuthRequest, res: Response) => {
  const userId = req.user.id

  const expenses = await prisma.expense.findMany({
    where: { userId },
    include: {
      category: true,
      zone: true
    },
    orderBy: { expenseDate: "desc" }
  })

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)

  const zones = await prisma.userZone.findMany({
    where: { userId },
    include: { zone: true }
  })

  const zoneNames = zones.map(z => z.zone.name)

  const categoryMap: Record<string, number> = {}

  expenses.forEach(e => {
    const name = e.category?.name || "Other"
    categoryMap[name] = (categoryMap[name] || 0) + e.amount
  })

  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value
  }))

  res.json({
    totalSpent,
    zones: zoneNames,
    categoryData,
    lastExpense: expenses[0] || null
  })
}


export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        dob: true,
        gender: true,
        image: true,
        createdAt: true
      }
    })

    res.json(users)
  } catch (error) {
    console.error("GET USERS ERROR:", error)
    res.status(500).json({ message: "Failed to fetch users" })
  }
}
