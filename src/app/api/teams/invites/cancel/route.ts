import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Team from "@/models/Team"
import TeamInvite from "@/models/TeamInvite"
import connectMongoDB from "@/lib/mongodb"

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const inviteId = searchParams.get("id")

    if (!inviteId) {
      return NextResponse.json({ error: "Invite ID is required" }, { status: 400 })
    }

    await connectMongoDB()

    // Find the invite
    const invite = await TeamInvite.findById(inviteId).populate("team")
    if (!invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Verify user has permission to cancel this invite (team owner or original inviter)
    const team = await Team.findById(invite.team._id)
    const hasPermission = team.owner.toString() === session.user.id || invite.inviter.toString() === session.user.id

    if (!hasPermission) {
      return NextResponse.json({ error: "You don't have permission to cancel this invitation" }, { status: 403 })
    }

    // Check if invite is still pending
    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Only pending invitations can be cancelled" }, { status: 400 })
    }

    // Delete the invite (this removes it from recipient's account too)
    await TeamInvite.findByIdAndDelete(inviteId)

    return NextResponse.json({ message: "Invitation cancelled successfully" }, { status: 200 })
  } catch (error) {
    console.error("Cancel invite error:", error)
    return NextResponse.json({ error: "Error cancelling invitation" }, { status: 500 })
  }
}
