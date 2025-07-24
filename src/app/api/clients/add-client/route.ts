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

    const clientData = await req.json()
    const { name, team: teamId, assignedCoach, selectedPackage, startDate } = clientData

    if (!name || !teamId || !assignedCoach || !selectedPackage) {
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

    // Verify the selected package exists in the team
    const packageExists = team.packages.some((pkg) => pkg.packageName === selectedPackage && pkg.isActive)
    if (!packageExists) {
      return NextResponse.json({ error: "Selected training package not found or inactive" }, { status: 400 })
    }

    // Build the client object with only the fields that have values
    const clientToSave: any = {
      name: name.trim(),
      team: teamId,
      assignedCoach,
      selectedPackage,
      startDate: startDate || new Date(),
      status: clientData.status || "active",
      createdBy: session.user.id,
    }

    // Only add optional fields if they have actual values (not empty strings)
    // IMPORTANT: Completely omit email field if not provided (don't set to null)
    if (typeof clientData.email === "string" && clientData.email.trim()) {
      clientToSave.email = clientData.email.trim()
    } else {
      delete clientToSave.email // <— this guarantees 'email' it's not passed as undefined/null
    }

    if (clientData.phone && clientData.phone.trim()) {
      clientToSave.phone = clientData.phone.trim()
    }
    if (clientData.age && !isNaN(Number(clientData.age))) {
      clientToSave.age = Number(clientData.age)
    }
    if (clientData.gender && clientData.gender.trim()) {
      clientToSave.gender = clientData.gender
    }
    if (clientData.currentWeight && !isNaN(Number(clientData.currentWeight))) {
      clientToSave.currentWeight = Number(clientData.currentWeight)
    }
    if (clientData.targetWeight && !isNaN(Number(clientData.targetWeight))) {
      clientToSave.targetWeight = Number(clientData.targetWeight)
    }
    if (clientData.height && !isNaN(Number(clientData.height))) {
      clientToSave.height = Number(clientData.height)
    }
    if (clientData.membershipType && clientData.membershipType.trim()) {
      clientToSave.membershipType = clientData.membershipType.trim()
    }
    if (clientData.notes && clientData.notes.trim()) {
      clientToSave.notes = clientData.notes.trim()
    }

    // use Client.create instead of new Client() to ensure we don't recreate the client model in the DB and it suddnely expects a value for email even if there wasn't one passed.
    const client = await Client.create(clientToSave)

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error("Add client error:", error)
    return NextResponse.json({ error: "Error creating client" }, { status: 500 })
  }
}
