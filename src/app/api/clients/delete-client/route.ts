import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Client from "@/models/Clients"
import Team from "@/models/Team"
import connectMongoDB from "@/lib/mongodb"

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get("id")

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

    await Client.findByIdAndDelete(clientId)

    return NextResponse.json({ message: "Client deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Delete client error:", error)
    return NextResponse.json({ error: "Error deleting client" }, { status: 500 })
  }
}
