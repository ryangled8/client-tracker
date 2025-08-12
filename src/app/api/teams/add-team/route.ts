import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Team from "@/models/Team"
import connectMongoDB from "@/lib/mongodb"
import { checkUserLimit } from "@/lib/subscription"
import mongoose from "mongoose"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // --- Subscription Limit Check ---
    const { allowed, limit } = await checkUserLimit(session.user.id, "teams")
    if (!allowed) {
      return NextResponse.json(
        { error: `Team creation limit of ${limit} reached. Please upgrade your plan.` },
        { status: 403 },
      )
    }
    // --- End of Check ---

    const { name } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    await connectMongoDB()

    const ownerId = new mongoose.Types.ObjectId(session.user.id)

    const newTeam = new Team({
      name,
      owner: ownerId,
      coaches: [], // The pre-save hook will add the owner to coaches
      clients: [],
    })

    await newTeam.save()

    const populatedTeam = await Team.findById(newTeam._id)
      .populate("owner", "name email")
      .populate("coaches.user", "name email")

    return NextResponse.json({ team: populatedTeam }, { status: 201 })
  } catch (error) {
    console.error("Add team error:", error)
    // Handle potential errors from checkUserLimit
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Error creating team" }, { status: 500 })
  }
}
