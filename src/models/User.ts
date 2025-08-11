import mongoose, { Schema, type Document, type ObjectId } from "mongoose"

export interface IUser extends Document {
  name: string
  email: string
  password?: string
  role: "coach" | "admin"
  profileImage?: string

  // Team relationships
  createdTeams: ObjectId[] // Teams this user created
  memberTeams: ObjectId[] // Teams this user is a member of

  // User preferences
  preferences: {
    tableView: "compact" | "relaxed"
  }

  // Subscription details
  subscription: {
    planId: "free" | "basic" | "pro" | "team"
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    stripePriceId?: string
    status: "active" | "canceled" | "past_due" | "incomplete" | "incomplete_expired" | "trialing"
    currentPeriodEnd?: Date
  }

  // Store IDs of purchased bolt-ons
  activeBoltOnIds: string[]

  // Metadata
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const SubscriptionSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      default: "free",
      enum: ["free", "basic", "pro", "team"],
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    stripePriceId: String,
    status: {
      type: String,
      enum: ["active", "canceled", "past_due", "incomplete", "incomplete_expired", "trialing"],
      default: "active",
    },
    currentPeriodEnd: Date,
  },
  { _id: false },
)

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ["coach", "admin"],
      default: "coach",
    },
    profileImage: String,

    // Team relationships
    createdTeams: [
      {
        type: Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    memberTeams: [
      {
        type: Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    preferences: {
      tableView: {
        type: String,
        enum: ["compact", "relaxed"],
        default: "relaxed",
      },
    },

    // Add subscription details
    subscription: {
      type: SubscriptionSchema,
      // Set default subscription for new users
      default: () => ({ planId: "free", status: "active" }),
    },

    // Store IDs of purchased bolt-ons
    activeBoltOnIds: {
      type: [String],
      default: [],
    },

    // Metadata
    lastLoginAt: Date,
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
UserSchema.index({ createdTeams: 1 })
UserSchema.index({ memberTeams: 1 })

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default User
