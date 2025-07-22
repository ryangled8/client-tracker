import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Team from "@/models/Team"
import Client from "@/models/Client"
import User from "@/models/User"
import connectMongoDB from "@/lib/mongodb"

export async function DELETE(req: Request) {
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

    const team = await Team.findById(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Only owner can delete team
    if (team.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only team owner can delete team" }, { status: 403 })
    }

    // Delete all clients in this team
    await Client.deleteMany({ team: teamId })

    // Remove team from all users' arrays
    await User.updateMany(
      { $or: [{ createdTeams: teamId }, { memberTeams: teamId }] },
      { $pull: { createdTeams: teamId, memberTeams: teamId } },
    )

    // Delete the team
    await Team.findByIdAndDelete(teamId)

    return NextResponse.json({ message: "Team deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Delete team error:", error)
    return NextResponse.json({ error: "Error deleting team" }, { status: 500 })
  }
}
