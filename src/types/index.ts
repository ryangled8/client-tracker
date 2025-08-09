// Clean TypeScript interfaces for frontend use
export type { IUser } from "../models/User"
export type { ITeam } from "../models/Team"
export type { ITeamInvite } from "../models/TeamInvite"
export type { IClient } from "../models/Client"

// Status types
export type ClientStatus = "active" | "inactive" | "paused"
export type InviteStatus = "pending" | "accepted" | "declined" | "expired"
export type Gender = "male" | "female" | "other" | "prefer-not-to-say"

// Frontend form types
export interface CreateTeamData {
  name: string
}

export interface CreatePackageData {
  packageName: string
  packageDuration: number
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
  selectedPackage: string
  startDate: Date
  currentWeight?: number
  targetWeight?: number
  height?: number
}

export interface InviteTeamMemberData {
  email: string
  message?: string
}

// Add the team settings interface
export interface TeamSettings {
  clientFormFields: {
    name: boolean
    email: boolean
    phone: boolean
    paymentDate: boolean
    age: boolean
    gender: boolean
    assignedCoach: boolean
    trainingPackage: boolean
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
  noticePeriodWeeks: number
  dateFormat: "dd/mm/yyyy" | "mm/dd/yyyy"
}

interface CoachUser {
  _id: string;
  name: string;
  email: string;
}

export interface Coach {
  _id: string;
  coachColor: string;
  user: CoachUser;
}
