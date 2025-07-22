import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Client from "@/models/Client"
import Team from "@/models/Team"
import connectMongoDB from "@/lib/mongodb"

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { clientId, ...updateData } = await req.json()

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    await connectMongoDB()

    const client = await Client.findById(clientId)
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Check if user has access to this client's team
    const team = await Team.findById(client.team)
    const hasAccess = team.owner.toString() === session.user.id || team.coaches.includes(session.user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      { ...updateData, updatedAt: new Date() },
      { new: true },
    )
      .populate("team", "name")
      .populate("assignedCoach", "name email")

    return NextResponse.json({ client: updatedClient }, { status: 200 })
  } catch (error) {
    console.error("Update client error:", error)
    return NextResponse.json({ error: "Error updating client" }, { status: 500 })
  }
}
