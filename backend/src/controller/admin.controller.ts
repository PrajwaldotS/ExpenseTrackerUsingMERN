import { Response } from "express"
import prisma from "../config/db"
import { AuthRequest } from "../middleware/auth.middleware"
import bcrypt from "bcrypt"
import { v2 as cloudinary } from "cloudinary"

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


export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, role } = req.body

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role }
    })

    res.json(updatedUser)
  } catch (error) {
    console.error("UPDATE ROLE ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string

    await prisma.user.delete({
      where: { id }
    })

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("DELETE USER ERROR:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const makeMeAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { role: "admin" }
    })

    res.json({ message: "You are now admin", updatedUser })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error updating role" })
  }
}

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, phone, dob, gender } = req.body

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser)
      return res.status(400).json({ message: "User already exists" })

    const hashedPassword = await bcrypt.hash(password, 10)

    let imageUrl = null

    if (req.file ) {
      const file = req.file
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "profile-photos" },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(file.buffer)
      })

      imageUrl = result.secure_url
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        dob: dob ? new Date(dob) : null,
        gender,
        image: imageUrl
      }
    })

    res.status(201).json(user)
  } catch (error: any) {
  console.error("CREATE USER ERROR:", error)
  res.status(500).json({ message: error?.message || "Something went wrong" })
}
}

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string

    const {
      name,
      email,
      dob,
      id_proof_type,
      role,
      status
    } = req.body

    let imageUrl: string | undefined

    if (req.file) {
      // if using cloudinary or local upload
      imageUrl = `/uploads/${req.file.filename}` // adjust if using cloudinary
    }

    const updatedUser = await prisma.user.update({
      
      where: { id },
      data: {
        name,
        email,
        dob: dob ? new Date(dob) : null,
        idProofType: id_proof_type,
        role,
        image: imageUrl,
        
      }
    })

    res.json(updatedUser)
    console.log("Updated user:", updatedUser)


  } catch (error) {
    console.error("UPDATE USER ERROR:", error)
    res.status(500).json({ message: "Failed to update user" })
  }
}
export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { newPassword } = req.body

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    })

    res.json({ message: "Password reset successfully" })

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error)
    res.status(500).json({ message: "Failed to reset password" })
  }
}

// export const toggleUserZone = async (req: AuthRequest, res: Response) => {

//   try {
//     const { userId, zoneId } = req.body

//     if (!userId || !zoneId) {
//       return res.status(400).json({ message: "Missing userId or zoneId" })
//     }

//     const existing = await prisma.userZone.findUnique({
//       where: {
//         userId_zoneId: {
//           userId,
//           zoneId
//         }
//       }
//     })

//     if (existing) {
//       // Remove zone
//       await prisma.userZone.delete({
//         where: {
//           userId_zoneId: {
//             userId,
//             zoneId
//           }
//         }
//       })

//       return res.json({ message: "Zone removed from user" })
//     }

//     // Assign zone
//     await prisma.userZone.create({
//       data: {
//         userId,
//         zoneId
//       }
//     })

//     res.json({ message: "Zone assigned to user" })

//   } catch (error) {
//     console.error("TOGGLE USER ZONE ERROR:", error)
//     res.status(500).json({ message: "Failed to toggle zone" })
//   }
// }
// export const getUserZones = async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.params.userId as string

//     const zones = await prisma.userZone.findMany({
//       where: { userId },
//       select: {
//         zoneId: true
//       }
//     })

//     const zoneIds = zones.map(z => z.zoneId)

//     res.json(zoneIds)

//   } catch (error) {
//     console.error("GET USER ZONES ERROR:", error)
//     res.status(500).json({ message: "Failed to fetch user zones" })
//   }
// }
