import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Team from "@/models/Team"
import connectMongoDB from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectMongoDB()

    // Get teams where user is owner or coach
    const teams = await Team.find({
      $or: [{ owner: session.user.id }, { coaches: session.user.id }],
    })
      .populate("owner", "name email")
      .populate("coaches", "name email")
      .sort({ createdAt: -1 })

    return NextResponse.json({ teams }, { status: 200 })
  } catch (error) {
    console.error("Get teams error:", error)
    return NextResponse.json({ error: "Error fetching teams" }, { status: 500 })
  }
}
