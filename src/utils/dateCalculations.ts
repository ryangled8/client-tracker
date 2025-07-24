// Frontend utility functions for date calculations
export interface ClientDates {
  packageEndDate: Date
  progressCallDate: Date
  renewalCallDate: Date
  planUpdateDate: Date
}

export function calculateClientDates(
  startDate: Date | string,
  trainingPackage: {
    packageDuration: number
    planProgressCall: number
    planRenewalCall: number
    planUpdateWeek: number
  },
  customDates?: {
    customProgressCallDate?: Date
    customRenewalCallDate?: Date
    customPlanUpdateDate?: Date
  },
): ClientDates {
  const start = new Date(startDate)

  return {
    packageEndDate: addWeeks(start, trainingPackage.packageDuration),
    progressCallDate: customDates?.customProgressCallDate || addWeeks(start, trainingPackage.planProgressCall),
    renewalCallDate: customDates?.customRenewalCallDate || addWeeks(start, trainingPackage.planRenewalCall),
    planUpdateDate: customDates?.customPlanUpdateDate || addWeeks(start, trainingPackage.planUpdateWeek),
  }
}

export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + weeks * 7)
  return result
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Helper to check if a date is overdue
export function isOverdue(date: Date): boolean {
  return new Date() > date
}

// Helper to get days until a date
export function getDaysUntil(date: Date): number {
  const today = new Date()
  const diffTime = date.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
