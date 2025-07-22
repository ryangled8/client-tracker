import mongoose, { Schema, type Document, type ObjectId } from "mongoose"

export interface ITeam extends Document {
  name: string
  owner: ObjectId // User who created the team
  coaches: ObjectId[] // All team coaches including owner
  clients: ObjectId[] // All clients added to team
  plans: {
    planName: string // name of plan (e.g., "12 Week Transformation")
    planDuration: number // duration of plan in weeks (e.g., 12 weeks)
    planProgressCall: number // what week during the 'planDuration' should the progress call be scheduled
    planRenewalCall: number // what week during the 'planDuration' should the renewal call be scheduled
    planUpdateWeek: number // what week during the 'planDuration' should the plan be updated
    isActive: boolean // whether this plan is currently available for assignment
    createdAt: Date
  }[]
  createdAt: Date
  updatedAt: Date
}

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coaches: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    clients: [
      {
        type: Schema.Types.ObjectId,
        ref: "Client",
      },
    ],
    plans: [
      {
        planName: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },
        planDuration: {
          type: Number,
          required: true,
          min: 1,
        },
        planProgressCall: {
          type: Number,
          required: true,
          min: 1,
        },
        planRenewalCall: {
          type: Number,
          required: true,
          min: 1,
        },
        planUpdateWeek: {
          type: Number,
          required: true,
          min: 1,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
teamSchema.index({ owner: 1 })
teamSchema.index({ coaches: 1 })
teamSchema.index({ name: 1, owner: 1 })
teamSchema.index({ clients: 1 })

// Ensure owner is always in coaches array
teamSchema.pre("save", function (next) {
  if (!this.coaches.includes(this.owner)) {
    this.coaches.push(this.owner)
  }
  next()
})

export default mongoose.models.Team || mongoose.model<ITeam>("Team", teamSchema)
