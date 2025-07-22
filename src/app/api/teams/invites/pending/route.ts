import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Team from "@/models/Team"
import User from "@/models/User"
import TeamInvite from "@/models/TeamInvite"
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

    // Ensure models are registered for Mongoose populate to work
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _teamModel = Team
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _userModel = User

    if (teamId) {
      // Get pending invites for a specific team (for team owners)
      const invites = await TeamInvite.find({
        team: teamId,
        status: "pending",
      })
        .populate("inviter", "name email")
        .populate("invitee", "name email")
        .sort({ createdAt: -1 })

      return NextResponse.json({ invites }, { status: 200 })
    } else {
      // Get pending invites for the current user
      const invites = await TeamInvite.find({
        $or: [
          { invitee: session.user.id, status: "pending" },
          { inviteeEmail: session.user.email, status: "pending" },
        ],
      })
        .populate("team", "name")
        .populate("inviter", "name email")
        .sort({ createdAt: -1 })

      return NextResponse.json({ invites }, { status: 200 })
    }
  } catch (error) {
    console.error("Get pending invites error:", error)
    return NextResponse.json({ error: "Error fetching invites" }, { status: 500 })
  }
}
