import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Team from "@/models/Team"
import User from "@/models/User"
import Client from "@/models/Client"
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
    const _clientModel = Client

    const team = await Team.findById(teamId)
      .populate("owner", "name email")
      .populate("coaches", "name email")
      .populate({
        path: "clients",
        populate: {
          path: "assignedCoach",
          select: "name email",
        },
      })

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

    // If the team doesn't have settings yet, add default settings
    if (!team.settings) {
      team.settings = {
        clientFormFields: {
          name: true,
          email: true,
          phone: true,
          age: false,
          gender: false,
          assignedCoach: true,
          trainingPlan: true,
          renewalCallDate: true,
          progressCallDate: true,
          planUpdateDate: true,
          currentWeight: false,
          targetWeight: false,
          height: false,
          status: true,
          membershipType: false,
          startDate: true,
          notes: false,
        },
        noticePeriodWeeks: 2,
        dateFormat: "dd/mm/yyyy",
      }
      await team.save()
    }

    return NextResponse.json({ team }, { status: 200 })
  } catch (error) {
    console.error("Get team error:", error)
    return NextResponse.json({ error: "Error fetching team" }, { status: 500 })
  }
}
