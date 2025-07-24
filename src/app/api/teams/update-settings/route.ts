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

    const { teamId, name, settings } = await req.json()

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    await connectMongoDB()

    const team = await Team.findById(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Only owner can update team settings
    if (team.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only team owner can update team settings" }, { status: 403 })
    }

    const updateData: any = {}

    if (name && name.trim()) {
      updateData.name = name.trim()
    }

    if (settings) {
      // Ensure required fields are always enabled
      if (settings.clientFormFields) {
        settings.clientFormFields.name = true
        settings.clientFormFields.assignedCoach = true
        settings.clientFormFields.trainingPackage = true
      }

      // Validate notice period
      if (settings.noticePeriodWeeks && (settings.noticePeriodWeeks < 1 || settings.noticePeriodWeeks > 12)) {
        return NextResponse.json({ error: "Notice period must be between 1 and 12 weeks" }, { status: 400 })
      }

      // Validate date format
      if (settings.dateFormat && !["dd/mm/yyyy", "mm/dd/yyyy"].includes(settings.dateFormat)) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
      }

      updateData.settings = settings
    }

    const updatedTeam = await Team.findByIdAndUpdate(teamId, updateData, { new: true })

    return NextResponse.json({ team: updatedTeam }, { status: 200 })
  } catch (error) {
    console.error("Update team settings error:", error)
    return NextResponse.json({ error: "Error updating team settings" }, { status: 500 })
  }
}
