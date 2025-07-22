import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Team from "@/models/Team"
import User from "@/models/User"
import Clients from "@/models/Clients"
import connectMongoDB from "@/lib/mongodb"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get("id")

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    await connectMongoDB()

    // Ensure models are registered for Mongoose populate to work
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _userModel = User
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _clientModel = Clients

    const team = await Team.findById(teamId)
      .populate("owner", "name email")
      .populate("coaches", "name email")
      .populate("clients")

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if user has access to this team
    const hasAccess =
      team.owner._id.toString() === session.user.id ||
      team.coaches.some((coach: any) => coach._id.toString() === session.user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ team }, { status: 200 })
  } catch (error) {
    console.error("Get team error:", error)
    return NextResponse.json({ error: "Error fetching team" }, { status: 500 })
  }
}
