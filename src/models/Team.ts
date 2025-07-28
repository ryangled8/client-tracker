import mongoose, { Schema, type Document, type ObjectId } from "mongoose"

export interface ITeam extends Document {
  name: string
  owner: ObjectId // User who created the team
  coaches: ObjectId[] // All team coaches including owner
  clients: ObjectId[] // All clients added to team
  packages: {
    packageName: string // name of package (e.g., "12 Week Transformation Package")
    durationInWeeks: number // duration of package in weeks (e.g., 12 weeks)
    progressIntervalInWeeks: number // how often progress calls occur (e.g., every 10 weeks)
    planUpdateIntervalInWeeks: number // how often plan updates occur (e.g., every 12 weeks)
    renewalCallWeeksBeforeEnd: number // weeks before package end for renewal call (default: 2)
    packageColor: string // hex color code for the package
    isActive: boolean // whether this package is currently available for assignment
    isRecurring: boolean // is a package recurring (e.g., monthly rolling subscription) (renewall date isn't calculated when true)
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
      trainingPackage: boolean // always true, can't be disabled
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
    packages: [
      {
        packageName: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },
        durationInWeeks: {
          type: Number,
          required: true,
          min: 1,
        },
        progressIntervalInWeeks: {
          type: Number,
          required: true,
          min: 1,
        },
        planUpdateIntervalInWeeks: {
          type: Number,
          required: true,
          min: 1,
        },
        renewalCallWeeksBeforeEnd: {
          type: Number,
          default: 2,
          min: 1,
        },
        packageColor: {
          type: String,
          default: "#3b82f6",
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        isRecurring: {
          type: Boolean,
          default: false,
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
        trainingPackage: { type: Boolean, default: true }, // always true
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
