import connectMongoDB from "@/lib/mongodb"
import { User } from "@/models/User"
import Team from "@/models/Team"
import { plans, boltOns } from "@/lib/plans"
import type { BoltOn } from "@/lib/plans"

type LimitType = "clients" | "teams" | "teamMembers"

/**
 * Checks if a user has reached a specific limit based on their subscription plan and bolt-ons.
 * @param userId - The ID of the user to check.
 * @param limitType - The type of limit to check ('clients', 'teams', 'teamMembers').
 * @returns An object containing whether the user is allowed to add more, their current usage, and their total limit.
 */
export async function checkUserLimit(
  userId: string,
  limitType: LimitType,
): Promise<{ allowed: boolean; current: number; limit: number }> {
  await connectMongoDB()

  // Fetch the user with their subscription and the teams they own.
  const user = await User.findById(userId).lean()
  if (!user) {
    throw new Error("User not found")
  }

  // --- 1. Calculate Total Limit (Plan + Bolt-ons) ---
  const planId = user.subscription?.planId || "free"
  const currentPlan = plans.find((p) => p.id === planId)
  if (!currentPlan) {
    throw new Error(`Plan with id "${planId}" not found`)
  }

  const baseLimit = currentPlan.limits[limitType]

  // Calculate increase from active bolt-ons
  const boltOnIncrease = (user.activeBoltOnIds || [])
    .map((boltOnId) => boltOns.find((b) => b.id === boltOnId))
    .filter((b): b is BoltOn => b !== undefined && b.type === "limit" && b.limit?.key === limitType)
    .reduce((total, b) => total + (b.limit?.increase || 0), 0)

  const totalLimit = baseLimit + boltOnIncrease

  // --- 2. Calculate Current Usage ---
  let currentUsage = 0
  const ownedTeams = await Team.find({ owner: userId }).lean()

  switch (limitType) {
    case "teams":
      currentUsage = ownedTeams.length
      break
    case "clients":
      // Sum the number of clients across all teams owned by the user
      currentUsage = ownedTeams.reduce((sum, team) => sum + (team.clients?.length || 0), 0)
      break
    case "teamMembers":
      // Sum the number of invited coaches (coaches array minus the owner) across all teams
      currentUsage = ownedTeams.reduce((sum, team) => sum + (team.coaches?.length > 0 ? team.coaches.length - 1 : 0), 0)
      break
  }

  return {
    allowed: currentUsage < totalLimit,
    current: currentUsage,
    limit: totalLimit,
  }
}
