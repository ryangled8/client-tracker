import Stripe from "stripe"

// Initialize the Stripe client with the secret key from environment variables.
// The API version is pinned to ensure stability and prevent breaking changes.
// This version must match the version expected by the installed Stripe SDK.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
  typescript: true,
})
