import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Client from "@/models/Client"
import Team from "@/models/Team"
import connectMongoDB from "@/lib/mongodb"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get("teamId")

    await connectMongoDB()

    const query: any = {}

    if (teamId) {
      // Get clients for specific team
      const team = await Team.findById(teamId)
      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 })
      }

      const hasAccess = team.owner.toString() === session.user.id || team.coaches.includes(session.user.id)

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      query.team = teamId
    } else {
      // Get all clients from user's teams
      const userTeams = await Team.find({
        $or: [{ owner: session.user.id }, { coaches: session.user.id }],
      }).select("_id")

      const teamIds = userTeams.map((team) => team._id)
      query.team = { $in: teamIds }
    }

    const clients = await Client.find(query)
      .populate("team", "name")
      .populate("assignedCoach", "name email")
      .sort({ createdAt: -1 })

    return NextResponse.json({ clients }, { status: 200 })
  } catch (error) {
    console.error("Get clients error:", error)
    return NextResponse.json({ error: "Error fetching clients" }, { status: 500 })
  }
}
