import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Team from "@/models/Team"
import connectMongoDB from "@/lib/mongodb"

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId, name, plans } = await req.json()

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    await connectMongoDB()

    const team = await Team.findById(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Only owner can update team
    if (team.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only team owner can update team" }, { status: 403 })
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (plans) updateData.plans = plans

    const updatedTeam = await Team.findByIdAndUpdate(teamId, updateData, { new: true })

    return NextResponse.json({ team: updatedTeam }, { status: 200 })
  } catch (error) {
    console.error("Update team error:", error)
    return NextResponse.json({ error: "Error updating team" }, { status: 500 })
  }
}
