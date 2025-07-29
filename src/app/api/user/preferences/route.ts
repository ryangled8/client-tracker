import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import User from "@/models/User"
import connectMongoDB from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectMongoDB()

    const user = await User.findById(session.user.id).select("preferences")
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ preferences: user.preferences || { tableView: "relaxed" } }, { status: 200 })
  } catch (error) {
    console.error("Get user preferences error:", error)
    return NextResponse.json({ error: "Error fetching preferences" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { preferences } = await req.json()

    if (!preferences) {
      return NextResponse.json({ error: "Preferences are required" }, { status: 400 })
    }

    await connectMongoDB()

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { preferences },
      { new: true, upsert: true },
    ).select("preferences")

    return NextResponse.json({ preferences: updatedUser.preferences }, { status: 200 })
  } catch (error) {
    console.error("Update user preferences error:", error)
    return NextResponse.json({ error: "Error updating preferences" }, { status: 500 })
  }
}
