import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Team from "@/models/Team"
import User from "@/models/User"
import TeamInvite from "@/models/TeamInvite"
import connectMongoDB from "@/lib/mongodb"

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { inviteId, action } = await req.json()

    if (!inviteId || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid invite ID or action" }, { status: 400 })
    }

    await connectMongoDB()

    // Find the invite and populate the team
    const invite = await TeamInvite.findById(inviteId).populate("team")
    if (!invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Check if user has permission to respond to this invite
    const canRespond = invite.invitee?.toString() === session.user.id || invite.inviteeEmail === session.user.email

    if (!canRespond) {
      return NextResponse.json({ error: "You don't have permission to respond to this invitation" }, { status: 403 })
    }

    // Check if invite is still valid
    if (invite.status !== "pending") {
      return NextResponse.json({ error: "This invitation is no longer valid" }, { status: 400 })
    }

    if (invite.expiresAt < new Date()) {
      await TeamInvite.findByIdAndUpdate(inviteId, { status: "expired" })
      return NextResponse.json({ error: "This invitation has expired" }, { status: 400 })
    }

    if (action === "accept") {
      // Add user to team using Team model
      await Team.findByIdAndUpdate(invite.team._id, {
        $addToSet: { coaches: session.user.id },
      })

      // Update user's memberTeams using User model
      await User.findByIdAndUpdate(session.user.id, {
        $addToSet: { memberTeams: invite.team._id },
      })

      // Update invite status
      await TeamInvite.findByIdAndUpdate(inviteId, {
        status: "accepted",
        respondedAt: new Date(),
        invitee: session.user.id,
      })

      return NextResponse.json({ message: "Invitation accepted successfully" }, { status: 200 })
    } else {
      // Decline invitation
      await TeamInvite.findByIdAndUpdate(inviteId, {
        status: "declined",
        respondedAt: new Date(),
        invitee: session.user.id,
      })

      return NextResponse.json({ message: "Invitation declined" }, { status: 200 })
    }
  } catch (error) {
    console.error("Respond to invite error:", error)
    return NextResponse.json({ error: "Error responding to invitation" }, { status: 500 })
  }
}
