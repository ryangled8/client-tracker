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

  // Metadata
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
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

    // Metadata
    lastLoginAt: Date,
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
userSchema.index({ createdTeams: 1 })
userSchema.index({ memberTeams: 1 })

export default mongoose.models.User || mongoose.model<IUser>("User", userSchema)
