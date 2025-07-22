import mongoose, { Schema, type Document, type ObjectId } from "mongoose"

export interface IClient extends Document {
  // Basic Information
  name: string
  email?: string
  phone?: string
  age?: number
  gender?: "male" | "female" | "other" | "prefer-not-to-say"

  // Team and Coach Assignment
  team: ObjectId
  assignedCoach: ObjectId

  // Training Information
  selectedPlan: string // planName from team's plans array
  startDate: Date
  membershipType?: string // Added membership type field

  // Physical Measurements
  currentWeight?: number
  targetWeight?: number
  height?: number // in cm

  // Status
  status: "active" | "inactive" | "paused" | "completed"

  // Manual override dates (optional - for custom scheduling)
  customRenewalCallDate?: Date
  customProgressCallDate?: Date
  customPlanUpdateDate?: Date

  // Notes and Progress Tracking
  notes?: string
  progressNotes: {
    date: Date
    note: string
    addedBy: ObjectId
    weight?: number
    measurements?: {
      chest?: number
      waist?: number
      hips?: number
      arms?: number
      thighs?: number
    }
  }[]

  // Metadata
  isActive: boolean
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}

const clientSchema = new Schema<IClient>(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true, // Allows multiple null values but unique non-null values
    },
    phone: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 1,
      max: 120,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
    },

    // Team and Coach Assignment
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    assignedCoach: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Training Information
    selectedPlan: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    membershipType: {
      type: String,
      trim: true,
    },

    // Physical Measurements
    currentWeight: {
      type: Number,
      min: 0,
    },
    targetWeight: {
      type: Number,
      min: 0,
    },
    height: {
      type: Number,
      min: 0, // in cm
    },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "paused", "completed"],
      default: "active",
    },

    // Manual override dates
    customRenewalCallDate: Date,
    customProgressCallDate: Date,
    customPlanUpdateDate: Date,

    // Notes and Progress Tracking
    notes: {
      type: String,
      maxlength: 2000,
    },
    progressNotes: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          required: true,
          maxlength: 1000,
        },
        addedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        weight: Number,
        measurements: {
          chest: Number,
          waist: Number,
          hips: Number,
          arms: Number,
          thighs: Number,
        },
      },
    ],

    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
clientSchema.index({ team: 1 })
clientSchema.index({ assignedCoach: 1 })
clientSchema.index({ status: 1 })
clientSchema.index({ startDate: 1 })
clientSchema.index({ selectedPlan: 1 })
clientSchema.index({ team: 1, status: 1 })
clientSchema.index({ assignedCoach: 1, status: 1 })

// Compound index for unique email per team
clientSchema.index(
  { team: 1, email: 1 },
  {
    unique: true,
    sparse: true,
  },
)

// Middleware to add client to team's clients array
clientSchema.post("save", async (doc) => {
  const Team = mongoose.model("Team")
  await Team.findByIdAndUpdate(doc.team, { $addToSet: { clients: doc._id } })
})

// Middleware to remove client from team's clients array when deleted
clientSchema.post("findOneAndDelete", async (doc) => {
  if (doc) {
    const Team = mongoose.model("Team")
    await Team.findByIdAndUpdate(doc.team, { $pull: { clients: doc._id } })
  }
})

export default mongoose.models.Client || mongoose.model<IClient>("Client", clientSchema)
