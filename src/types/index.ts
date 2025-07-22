// Clean TypeScript interfaces for frontend use
export type { IUser } from "../models/User"
export type { ITeam } from "../models/Team"
export type { ITeamInvite } from "../models/TeamInvite"
export type { IClient } from "../models/Clients"

// Status types
export type ClientStatus = "active" | "inactive" | "paused" | "completed"
export type InviteStatus = "pending" | "accepted" | "declined" | "expired"
export type Gender = "male" | "female" | "other" | "prefer-not-to-say"

// Frontend form types
export interface CreateTeamData {
  name: string
}

export interface CreatePlanData {
  planName: string
  planDuration: number
  planProgressCall: number
  planRenewalCall: number
  planUpdateWeek: number
}

export interface CreateClientData {
  name: string
  email?: string
  phone?: string
  age?: number
  gender?: Gender
  assignedCoach: string
  selectedPlan: string
  startDate: Date
  currentWeight?: number
  targetWeight?: number
  height?: number
}

export interface InviteTeamMemberData {
  email: string
  message?: string
}
