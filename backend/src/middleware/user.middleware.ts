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
