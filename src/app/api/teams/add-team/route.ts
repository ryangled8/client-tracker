import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Team from "@/models/Team"
import User from "@/models/User"
import connectMongoDB from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    await connectMongoDB()

    // Create the team
    const team = new Team({
      name,
      owner: session.user.id,
      coaches: [
        {
          user: session.user.id,
          coachColor: "#3b82f6", // optional, will use default if omitted
        },
      ],      
    })

    await team.save()

    // Add team to user's createdTeams
    await User.findByIdAndUpdate(session.user.id, {
      $addToSet: { createdTeams: team._id },
    })

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error("Add team error:", error)
    return NextResponse.json({ error: "Error creating team" }, { status: 500 })
  }
}
