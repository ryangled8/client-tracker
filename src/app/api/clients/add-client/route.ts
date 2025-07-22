import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Client from "@/models/Clients"
import Team from "@/models/Team"
import connectMongoDB from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientData = await req.json()
    const { name, team: teamId, assignedCoach, selectedPlan, startDate } = clientData

    if (!name || !teamId || !assignedCoach || !selectedPlan) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectMongoDB()

    // Verify user has access to this team
    const team = await Team.findById(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const hasAccess = team.owner.toString() === session.user.id || team.coaches.includes(session.user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Verify the selected plan exists in the team
    const planExists = team.plans.some((plan) => plan.planName === selectedPlan && plan.isActive)
    if (!planExists) {
      return NextResponse.json({ error: "Selected plan not found or inactive" }, { status: 400 })
    }

    const client = new Client({
      ...clientData,
      createdBy: session.user.id,
      startDate: startDate || new Date(),
    })

    await client.save()

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error("Add client error:", error)
    return NextResponse.json({ error: "Error creating client" }, { status: 500 })
  }
}
