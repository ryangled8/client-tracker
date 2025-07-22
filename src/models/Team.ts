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
  settings: {
    clientFormFields: {
      name: boolean // always true, can't be disabled
      email: boolean
      phone: boolean
      age: boolean
      gender: boolean
      assignedCoach: boolean // always true, can't be disabled
      trainingPlan: boolean // always true, can't be disabled
      renewalCallDate: boolean
      progressCallDate: boolean
      planUpdateDate: boolean
      currentWeight: boolean
      targetWeight: boolean
      height: boolean
      status: boolean
      membershipType: boolean
      startDate: boolean
      notes: boolean
    }
    noticePeriodWeeks: number // weeks to highlight upcoming dates
    dateFormat: "dd/mm/yyyy" | "mm/dd/yyyy"
  }
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
        planColor: {
          type: String,
          default: "#3b82f6",
          validate: {
            validator: (v: string) => /^#[0-9A-Fa-f]{6}$/.test(v),
            message: "Plan color must be a valid hex color code",
          },
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
    settings: {
      clientFormFields: {
        name: { type: Boolean, default: true }, // always true
        email: { type: Boolean, default: true },
        phone: { type: Boolean, default: true },
        age: { type: Boolean, default: false },
        gender: { type: Boolean, default: false },
        assignedCoach: { type: Boolean, default: true }, // always true
        trainingPlan: { type: Boolean, default: true }, // always true
        renewalCallDate: { type: Boolean, default: true },
        progressCallDate: { type: Boolean, default: true },
        planUpdateDate: { type: Boolean, default: true },
        currentWeight: { type: Boolean, default: false },
        targetWeight: { type: Boolean, default: false },
        height: { type: Boolean, default: false },
        status: { type: Boolean, default: true },
        membershipType: { type: Boolean, default: false },
        startDate: { type: Boolean, default: true },
        notes: { type: Boolean, default: false },
      },
      noticePeriodWeeks: { type: Number, default: 2, min: 1, max: 12 },
      dateFormat: { type: String, enum: ["dd/mm/yyyy", "mm/dd/yyyy"], default: "dd/mm/yyyy" },
    },
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
