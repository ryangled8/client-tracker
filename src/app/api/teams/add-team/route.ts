import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Team from "@/models/Team"
import User from "@/models/User"
import connectMongoDB from "@/lib/mongodb"
import { checkUserLimit } from "@/lib/subscription"

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
        { error: `Team limit of ${limit} reached. Please upgrade your plan.` },
        { status: 403 }, // 403 Forbidden is appropriate for plan limits
      )
    }
    // --- End of Check ---

    const { name } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    await connectMongoDB()

    // Create the team
    const team = new Team({
      name,
      owner: session.user.id,
      coaches: [session.user.id], // Owner is automatically a coach
    })

    await team.save()

    // Add team to user's createdTeams
    await User.findByIdAndUpdate(session.user.id, {
      $addToSet: { createdTeams: team._id },
    })

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error("Add team error:", error)
    // Handle potential errors from checkUserLimit
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Error creating team" }, { status: 500 })
  }
}
