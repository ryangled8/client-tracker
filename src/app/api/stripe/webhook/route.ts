import { NextResponse } from "next/server"
import { headers } from "next/headers"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import connectMongoDB from "@/lib/mongodb"
import { User } from "@/models/User"
import { plans } from "@/lib/plans"

export async function POST(req: Request) {
  console.log("--- Stripe Webhook Endpoint Hit ---")

  const body = await req.text()
  const headerList = await headers()
  const signature = headerList.get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error: any) {
    console.error(`[WEBHOOK_ERROR] Signature verification failed: ${error.message}`)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  console.log(`[WEBHOOK_INFO] Received event: ${event.type}`)

  try {
    await connectMongoDB()

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      console.log("[WEBHOOK_INFO] Handling checkout.session.completed")

      if (!session.subscription) {
        console.error("[WEBHOOK_ERROR] No subscription ID found on checkout session.")
        return new NextResponse("Webhook Error: Missing subscription data", { status: 400 })
      }

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      const userId = session.metadata?.userId

      if (!userId) {
        console.error("[WEBHOOK_ERROR] No userId in metadata.")
        return new NextResponse("Webhook Error: No user ID in metadata", { status: 400 })
      }

      const priceId = subscription.items.data[0]?.price.id
      if (!priceId) {
        console.error("[WEBHOOK_ERROR] Could not find priceId on subscription item.")
        return new NextResponse("Webhook Error: Missing priceId", { status: 400 })
      }

      const plan = plans.find(
        (p) => p.pricing.monthly.stripePriceId === priceId || p.pricing.annually?.stripePriceId === priceId,
      )

      if (!plan) {
        console.error(`[WEBHOOK_ERROR] Plan not found for price ID: ${priceId}`)
        return new NextResponse(`Webhook Error: Plan not found`, { status: 400 })
      }

      // --- CORRECTED PROPERTY ACCESS ---
      const subscriptionItem = subscription.items.data[0]
      const periodEndTimestamp = subscriptionItem?.current_period_end
      // --- END CORRECTED PROPERTY ACCESS ---

      if (typeof periodEndTimestamp !== "number") {
        console.error(
          `[WEBHOOK_ERROR] Stripe did not return a valid number for current_period_end. Received: ${periodEndTimestamp}`,
        )
        return new NextResponse("Webhook Error: Invalid current_period_end from Stripe.", { status: 400 })
      }
      const periodEndDate = new Date(periodEndTimestamp * 1000)

      console.log(`[WEBHOOK_INFO] Found user ${userId} and plan ${plan.id}. Updating database...`)

      await User.findByIdAndUpdate(userId, {
        "subscription.stripeSubscriptionId": subscription.id,
        "subscription.stripeCustomerId": subscription.customer as string,
        "subscription.stripePriceId": priceId,
        "subscription.planId": plan.id,
        "subscription.status": subscription.status,
        "subscription.currentPeriodEnd": periodEndDate,
      })

      console.log(`[WEBHOOK_SUCCESS] User ${userId} updated to plan ${plan.id}.`)
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription
      console.log(`[WEBHOOK_INFO] Handling ${event.type} for subscription ${subscription.id}`)

      const priceId = subscription.items.data[0]?.price.id
      const planId =
        event.type === "customer.subscription.deleted"
          ? "free"
          : plans.find(
              (p) => p.pricing.monthly.stripePriceId === priceId || p.pricing.annually?.stripePriceId === priceId,
            )?.id

      if (!planId && event.type !== "customer.subscription.deleted") {
        console.error(`[WEBHOOK_ERROR] Plan not found for price ID during update: ${priceId}`)
      }

      // --- CORRECTED PROPERTY ACCESS ---
      const subscriptionItem = subscription.items.data[0]
      const periodEndTimestamp = subscriptionItem?.current_period_end
      // --- END CORRECTED PROPERTY ACCESS ---

      if (typeof periodEndTimestamp !== "number") {
        console.error(
          `[WEBHOOK_ERROR] Stripe did not return a valid number for current_period_end on update/delete. Received: ${periodEndTimestamp}`,
        )
        return new NextResponse("Webhook Error: Invalid current_period_end from Stripe.", { status: 400 })
      }
      const periodEndDate = new Date(periodEndTimestamp * 1000)

      console.log(
        `[WEBHOOK_INFO] Updating subscription ${subscription.id} to plan ${planId} with status ${subscription.status}`,
      )

      await User.findOneAndUpdate(
        { "subscription.stripeSubscriptionId": subscription.id },
        {
          "subscription.status": subscription.status,
          "subscription.planId": planId,
          "subscription.stripePriceId": event.type === "customer.subscription.deleted" ? null : priceId,
          "subscription.currentPeriodEnd": periodEndDate,
        },
      )
      console.log(`[WEBHOOK_SUCCESS] Subscription ${subscription.id} status updated.`)
    }
  } catch (error) {
    console.error("[WEBHOOK_DB_ERROR] Error processing webhook:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }

  return new NextResponse(null, { status: 200 })
}
