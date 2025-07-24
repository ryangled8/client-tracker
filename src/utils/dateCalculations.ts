// Package Date Calculations using date-fns to avoid long-term drift due to uneven days in months & leap years.

import { addWeeks, subWeeks, format } from "date-fns"

export interface PackageConfig {
  durationInWeeks: number
  progressIntervalInWeeks: number
  planUpdateIntervalInWeeks: number
  renewalCallWeeksBeforeEnd: number
}

export interface ClientDates {
  packageEndDate: Date
  nextProgressCallDate: Date | null
  nextPlanUpdateDate: Date | null
  renewalCallDate: Date
  allProgressCallDates: Date[]
  allPlanUpdateDates: Date[]
}

export function calculateClientDates(
  startDate: Date | string,
  packageConfig: PackageConfig,
  customRenewalCallDate?: Date | string,
): ClientDates {
  const start = new Date(startDate)
  const { durationInWeeks, progressIntervalInWeeks, planUpdateIntervalInWeeks, renewalCallWeeksBeforeEnd } =
    packageConfig

  // Calculate package end date
  const packageEndDate = addWeeks(start, durationInWeeks)

  // Calculate all progress call dates
  const allProgressCallDates: Date[] = []
  const totalProgressIntervals = Math.floor(durationInWeeks / progressIntervalInWeeks)
  for (let i = 1; i <= totalProgressIntervals; i++) {
    allProgressCallDates.push(addWeeks(start, i * progressIntervalInWeeks))
  }

  // Calculate all plan update dates
  const allPlanUpdateDates: Date[] = []
  const totalPlanUpdates = Math.floor(durationInWeeks / planUpdateIntervalInWeeks)
  for (let i = 1; i <= totalPlanUpdates; i++) {
    allPlanUpdateDates.push(addWeeks(start, i * planUpdateIntervalInWeeks))
  }

  // Find next upcoming progress call date
  const now = new Date()
  const nextProgressCallDate = allProgressCallDates.find((date) => date > now) || null

  // Find next upcoming plan update date
  const nextPlanUpdateDate = allPlanUpdateDates.find((date) => date > now) || null

  // Calculate renewal call date (2 weeks before package end, or custom date)
  const renewalCallDate = customRenewalCallDate
    ? new Date(customRenewalCallDate)
    : subWeeks(packageEndDate, renewalCallWeeksBeforeEnd)

  return {
    packageEndDate,
    nextProgressCallDate,
    nextPlanUpdateDate,
    renewalCallDate,
    allProgressCallDates,
    allPlanUpdateDates,
  }
}

export function formatDateForDisplay(date: Date, dateFormat: "dd/mm/yyyy" | "mm/dd/yyyy"): string {
  if (dateFormat === "dd/mm/yyyy") {
    return format(date, "dd/MM/yyyy")
  } else {
    return format(date, "MM/dd/yyyy")
  }
}

export function generateExampleDates(
  durationInWeeks: number,
  progressIntervalInWeeks: number,
  planUpdateIntervalInWeeks: number,
  renewalCallWeeksBeforeEnd = 2,
): {
  progressCallWeeks: number[]
  planUpdateWeeks: number[]
  renewalCallWeek: number
} {
  const progressCallWeeks: number[] = []
  const totalProgressIntervals = Math.floor(durationInWeeks / progressIntervalInWeeks)
  for (let i = 1; i <= totalProgressIntervals; i++) {
    progressCallWeeks.push(i * progressIntervalInWeeks)
  }

  const planUpdateWeeks: number[] = []
  const totalPlanUpdates = Math.floor(durationInWeeks / planUpdateIntervalInWeeks)
  for (let i = 1; i <= totalPlanUpdates; i++) {
    planUpdateWeeks.push(i * planUpdateIntervalInWeeks)
  }

  const renewalCallWeek = Math.max(1, durationInWeeks - renewalCallWeeksBeforeEnd)

  return {
    progressCallWeeks,
    planUpdateWeeks,
    renewalCallWeek,
  }
}
