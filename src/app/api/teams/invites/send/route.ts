import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Team from "@/models/Team"
import User from "@/models/User"
import TeamInvite from "@/models/TeamInvite"
import connectMongoDB from "@/lib/mongodb"
import { randomBytes } from "crypto"

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

    // Verify user has permission to invite to this team
    const team = await Team.findById(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const hasPermission = team.owner.toString() === session.user.id || team.coaches.includes(session.user.id)
    if (!hasPermission) {
      return NextResponse.json({ error: "You don't have permission to invite to this team" }, { status: 403 })
    }

    // Check if user is already a team member
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser && team.coaches.includes(existingUser._id)) {
      return NextResponse.json({ error: "User is already a member of this team" }, { status: 400 })
    }

    // Check for existing invite (any status)
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
        // Allow re-inviting users who have declined, expired invites, or even previously accepted but may have left
        const token = randomBytes(32).toString("hex")
        existingInvite.status = "pending"
        existingInvite.message = message || ""
        existingInvite.token = token
        existingInvite.inviter = session.user.id
        existingInvite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        existingInvite.respondedAt = undefined

        await existingInvite.save()
        return NextResponse.json({ message: "Invitation sent successfully" }, { status: 201 })
      }
    }

    // Create new invitation if none exists
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
    console.error("Invite coach error:", error)
    return NextResponse.json({ error: "Error sending invitation" }, { status: 500 })
  }
}
