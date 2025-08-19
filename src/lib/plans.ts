// This file defines the subscription plans and bolt-ons available in the application.
// Using a static definition file like this makes it easy to manage pricing and features centrally.

export interface Plan {
  id: "free" | "basic" | "pro" | "team"
  name: string
  description: string
  pricing: {
    monthly: {
      price: number // Monthly price in USD
      stripePriceId: string
    }
    annually?: {
      // Annual pricing is optional
      price: number // Annual price in USD
      stripePriceId: string
    }
  }
  features: string[]
  limits: {
    clients: number
    teams: number
    teamMembers: number // Total invites across all teams owned by the user
    boltOns: number
  }
}

type PlanId = Plan["id"]

export const plansMap: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    description: "For individuals just getting started.",
    pricing: {
      monthly: { price: 0, stripePriceId: "" }, // No Stripe ID for free plan
    },
    features: ["Up to 5 clients", "Create 1 team", "No team member invites", "No bolt-ons"],
    limits: {
      clients: 5,
      teams: 1,
      teamMembers: 0,
      boltOns: 0,
    },
  },
  basic: {
    id: "basic",
    name: "Basic",
    description: "For small coaches growing their business.",
    pricing: {
      monthly: { price: 9.99, stripePriceId: "price_1Rut0WBTwPZ07FpqU2bxmfhh" },
      annually: { price: 99.99, stripePriceId: "price_1Rut0WBTwPZ07FpqsCubhR3i" },
    },
    features: ["Up to 25 clients", "Create 1 team", "No team member invites", "Add up to 1 bolt-on"],
    limits: {
      clients: 25,
      teams: 1,
      teamMembers: 0,
      boltOns: 1,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For established coaches and small teams.",
    pricing: {
      monthly: { price: 15.99, stripePriceId: "price_1RutBeBTwPZ07FpqAdtCE9Yv" },
      annually: { price: 180, stripePriceId: "price_1RutBsBTwPZ07FpqlOarPlNh" },
    },
    features: ["Up to 50 clients", "Create 1 team", "Invite 1 team member", "Add up to 2 bolt-ons"],
    limits: {
      clients: 50,
      teams: 1,
      teamMembers: 1,
      boltOns: 2,
    },
  },
  team: {
    id: "team",
    name: "Team",
    description: "For larger teams and agencies.",
    pricing: {
      monthly: { price: 20, stripePriceId: "price_1RutD4BTwPZ07Fpq0uQG4FWc" },
      annually: { price: 220, stripePriceId: "price_1RutDNBTwPZ07FpqXrgOmyCv" },
    },
    features: ["Unlimited clients", "Create up to 2 teams", "Invite up to 2 team members", "Unlimited bolt-ons"],
    limits: {
      clients: -1, // Use -1 for unlimited instead of Number.POSITIVE_INFINITY
      teams: 2,
      teamMembers: 2,
      boltOns: -1, // Use -1 for unlimited instead of Number.POSITIVE_INFINITY
    },
  },
}

const plans: Plan[] = Object.values(plansMap)
export default plans

// Also export as named export for backward compatibility
export { plans }

export interface BoltOn {
  id: string
  name: string
  description: string
  pricing: {
    monthly: {
      price: number
      stripePriceId: string
    }
    annually?: {
      price: number
      stripePriceId: string
    }
  }
  type: "limit" | "feature"
  limit?: {
    key: "clients" | "teamMembers" | "teams"
    increase: number
  }
  featureKey?: "clientCheckIn" | "calendarIntegration" | "advancedAnalytics"
}

type BoltOnId = BoltOn["id"]

// Example bolt-ons updated with new pricing structure
export const boltOns: Record<BoltOnId, BoltOn> = {
  bolt_clients_5: {
    id: "bolt_clients_5",
    name: "+5 Clients",
    description: "Increase your client limit by 5.",
    pricing: {
      monthly: { price: 5, stripePriceId: "price_bolt_clients_5_monthly_placeholder" },
    },
    type: "limit",
    limit: { key: "clients", increase: 5 },
  },
  bolt_team_member_1: {
    id: "bolt_team_member_1",
    name: "+1 Team Member",
    description: "Increase your team member invite limit by 1.",
    pricing: {
      monthly: { price: 10, stripePriceId: "price_bolt_team_member_1_monthly_placeholder" },
    },
    type: "limit",
    limit: { key: "teamMembers", increase: 1 },
  },
  bolt_feature_checkin: {
    id: "bolt_feature_checkin",
    name: "Client Check-in Feature",
    description: "Unlock the client check-in feature.",
    pricing: {
      monthly: { price: 15, stripePriceId: "price_bolt_feature_checkin_monthly_placeholder" },
    },
    type: "feature",
    featureKey: "clientCheckIn",
  },
}

export const boltOnsArray: BoltOn[] = Object.values(boltOns)
