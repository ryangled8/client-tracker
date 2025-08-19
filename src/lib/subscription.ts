import connectMongoDB from "@/lib/mongodb"
import User from "@/models/User"
import Team from "@/models/Team"
import Client from "@/models/Client"
import { plansMap, boltOns } from "@/lib/plans"
import type { PlanId, BoltOnId, LimitType } from "@/types"
import type { IUser } from "@/types"

/**
 * Checks if a user has exceeded a specific limit based on their subscription plan and bolt-ons.
 * @param userId - The ID of the user to check.
 * @param limitType - The type of limit to check ('teams', 'clients', or 'teamMembers').
 * @returns An object containing whether the user is allowed to add more, their current usage, and their total limit.
 */
export async function checkUserLimit(
  userId: string,
  limitType: LimitType,
): Promise<{ allowed: boolean; current: number; limit: number }> {
  await connectMongoDB()

  const user = (await User.findById(userId).select("subscription activeBoltOnIds").lean()) as IUser | null
  if (!user) {
    throw new Error("User not found")
  }

  // Determine the user's plan, defaulting to 'free' if none is set.
  const planId = user.subscription?.planId || "free"
  const userPlan = plansMap[planId as PlanId]

  // Get the base limit from the plan.
  let limit = userPlan.limits[limitType]

  // If the limit is -1, it's unlimited, so no need to calculate usage.
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 }
  }

  // Add limits from any active bolt-ons.
  if (user.activeBoltOnIds && user.activeBoltOnIds.length > 0) {
    for (const boltOnId of user.activeBoltOnIds) {
      const boltOnDetails = boltOns[boltOnId as BoltOnId]
      if (
        boltOnDetails &&
        boltOnDetails.type === "limit" &&
        boltOnDetails.limit &&
        boltOnDetails.limit.key === limitType
      ) {
        limit += boltOnDetails.limit.increase || 0
      }
    }
  }

  // Calculate the current usage for the given limit type.
  let current = 0
  const userTeams = await Team.find({ owner: userId }).select("_id coaches")

  if (limitType === "teams") {
    current = userTeams.length
  } else if (limitType === "clients") {
    const teamIds = userTeams.map((team) => team._id)
    current = await Client.countDocuments({ team: { $in: teamIds } })
  } else if (limitType === "teamMembers") {
    current = userTeams.reduce((acc, team) => acc + Math.max(0, team.coaches.length - 1), 0)
  }

  return {
    allowed: current < limit,
    current,
    limit,
  }
}

/**
 * Checks if a user can downgrade to a specific plan based on their current usage.
 * This function prevents downgrades that would exceed the new plan's limits.
 * @param userId - The ID of the user to check.
 * @param newPlanId - The plan they want to downgrade to.
 * @returns An object containing whether they can downgrade and detailed violation messages.
 */
export async function checkDowngradeEligibility(
  userId: string,
  newPlanId: PlanId,
): Promise<{
  canDowngrade: boolean
  violations: Array<{
    type: LimitType
    current: number
    newLimit: number
    excess: number
    message: string
  }>
  blockingMessage: string
}> {
  await connectMongoDB()

  const newPlan = plansMap[newPlanId]
  const violations: Array<{
    type: LimitType
    current: number
    newLimit: number
    excess: number
    message: string
  }> = []

  // Check each limit type
  const limitTypes: LimitType[] = ["teams", "clients", "teamMembers"]

  for (const limitType of limitTypes) {
    const { current } = await checkUserLimit(userId, limitType)
    const newLimit = newPlan.limits[limitType]

    // Skip unlimited limits (-1)
    if (newLimit !== -1 && current > newLimit) {
      const excess = current - newLimit
      let message = ""

      // Create user-friendly messages based on limit type
      switch (limitType) {
        case "teams":
          message = `You have ${current} teams but ${newPlan.name} allows only ${newLimit}. Delete ${excess} team${excess > 1 ? "s" : ""} to downgrade.`
          break
        case "clients":
          message = `You have ${current} clients but ${newPlan.name} allows only ${newLimit}. Remove ${excess} client${excess > 1 ? "s" : ""} to downgrade.`
          break
        case "teamMembers":
          message = `You have ${current} team members but ${newPlan.name} allows only ${newLimit}. Remove ${excess} team member${excess > 1 ? "s" : ""} to downgrade.`
          break
        default:
          message = `You exceed the ${limitType} limit for ${newPlan.name}. Reduce your usage to downgrade.`
      }

      violations.push({
        type: limitType,
        current,
        newLimit,
        excess,
        message,
      })
    }
  }

  // Create blocking message
  let blockingMessage = ""
  if (violations.length === 0) {
    blockingMessage = `You can downgrade to ${newPlan.name}.`
  } else if (violations.length === 1) {
    blockingMessage = violations[0].message
  } else {
    blockingMessage = `Cannot downgrade to ${newPlan.name}. You have ${violations.length} limit violations that must be resolved first.`
  }

  return {
    canDowngrade: violations.length === 0,
    violations,
    blockingMessage,
  }
}
