import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { compare } from "bcrypt"
import User from "@/models/User"
import connectMongoDB from "@/lib/mongodb"

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { password, confirmText } = await req.json()

    if (!password || !confirmText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (confirmText !== "DELETE") {
      return NextResponse.json({ error: "Confirmation text must be 'DELETE'" }, { status: 400 })
    }

    await connectMongoDB()

    const user = await User.findById(session.user.id)

    if (!user || !user.password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Password is incorrect" }, { status: 400 })
    }

    // Delete user account
    await User.findByIdAndDelete(session.user.id)

    return NextResponse.json({ message: "Account deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Error deleting account" }, { status: 500 })
  }
}
