import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Client from "@/models/Client"
import Team from "@/models/Team"
import connectMongoDB from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId, emails } = await req.json()

    if (!teamId || !emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: "Team ID and emails array are required" }, { status: 400 })
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

    // Find existing clients with matching emails
    const existingClients = await Client.find({
      team: teamId,
      email: { $in: emails.map((email) => new RegExp(`^${email}$`, "i")) },
    }).select("name email")

    const duplicates = existingClients.map((client) => ({
      email: client.email,
      clientName: client.name,
    }))

    return NextResponse.json({ duplicates }, { status: 200 })
  } catch (error) {
    console.error("Check duplicates error:", error)
    return NextResponse.json({ error: "Error checking duplicates" }, { status: 500 })
  }
}
