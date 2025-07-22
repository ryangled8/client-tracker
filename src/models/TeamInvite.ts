import mongoose, { Schema, type Document, type ObjectId } from "mongoose"

export interface ITeamInvite extends Document {
  team: ObjectId
  inviter: ObjectId // User who sent the invite
  inviteeEmail: string // Email of person being invited
  invitee?: ObjectId // User ID if they're already registered
  status: "pending" | "accepted" | "declined" | "expired"
  message?: string
  token: string // Unique token for invite links
  expiresAt: Date
  respondedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const teamInviteSchema = new Schema<ITeamInvite>(
  {
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    inviter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inviteeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    invitee: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired"],
      default: "pending",
    },
    message: {
      type: String,
      maxlength: 500,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    respondedAt: Date,
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
teamInviteSchema.index({ team: 1, inviteeEmail: 1 }, { unique: true })
teamInviteSchema.index({ token: 1 })
teamInviteSchema.index({ status: 1 })
teamInviteSchema.index({ expiresAt: 1 })

export default mongoose.models.TeamInvite || mongoose.model<ITeamInvite>("TeamInvite", teamInviteSchema)
