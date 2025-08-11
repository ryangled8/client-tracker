import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Team from "@/models/Team"
import User from "@/models/User"
import TeamInvite from "@/models/TeamInvite"
import connectMongoDB from "@/lib/mongodb"
import { randomBytes } from "crypto"
import { checkUserLimit } from "@/lib/subscription" // Import the utility

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId, email, message } = await req.json()

    if (!teamId || !email) {
      return NextResponse.json({ error: "Team ID and email are required" }, { status: 400 })
    }

    await connectMongoDB()

    const team = await Team.findById(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const hasPermission = team.owner.toString() === session.user.id || team.coaches.includes(session.user.id)
    if (!hasPermission) {
      return NextResponse.json({ error: "You don't have permission to invite to this team" }, { status: 403 })
    }

    // --- Subscription Limit Check (only applies to the team owner) ---
    if (team.owner.toString() === session.user.id) {
      const { allowed, limit } = await checkUserLimit(session.user.id, "teamMembers")
      if (!allowed) {
        return NextResponse.json(
          { error: `Team member invite limit of ${limit} reached. Please upgrade your plan.` },
          { status: 403 },
        )
      }
    }
    // --- End of Check ---

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser && team.coaches.includes(existingUser._id)) {
      return NextResponse.json({ error: "User is already a member of this team" }, { status: 400 })
    }

    const existingInvite = await TeamInvite.findOne({
      team: teamId,
      inviteeEmail: email.toLowerCase(),
    })

    if (existingInvite) {
      if (existingInvite.status === "pending") {
        return NextResponse.json({ error: "An invitation has already been sent to this email" }, { status: 400 })
      } else if (
        existingInvite.status === "declined" ||
        existingInvite.status === "expired" ||
        existingInvite.status === "accepted"
      ) {
        const token = randomBytes(32).toString("hex")
        existingInvite.status = "pending"
        existingInvite.message = message || ""
        existingInvite.token = token
        existingInvite.inviter = session.user.id
        existingInvite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        existingInvite.respondedAt = undefined

        await existingInvite.save()
        return NextResponse.json({ message: "Invitation re-sent successfully" }, { status: 200 })
      }
    }

    const token = randomBytes(32).toString("hex")
    const invite = new TeamInvite({
      team: teamId,
      inviter: session.user.id,
      inviteeEmail: email.toLowerCase(),
      invitee: existingUser?._id || null,
      status: "pending",
      message: message || "",
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })

    await invite.save()

    return NextResponse.json({ message: "Invitation sent successfully" }, { status: 201 })
  } catch (error) {
    console.error("Invite send error:", error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Error sending invitation" }, { status: 500 })
  }
}
