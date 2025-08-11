"use server"

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { User } from "@/models/User"
import connectMongoDB from "@/lib/mongodb"

const absoluteUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${baseUrl}${path}`
}

/**
 * Creates a Stripe Checkout session for a specific price ID.
 * @param priceId The Stripe Price ID the user wants to subscribe to.
 */
export async function upgradePlan(priceId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "You must be logged in to upgrade." };
  }

  if (!priceId) {
    return { error: "Invalid plan selected." };
  }

  await connectMongoDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return { error: "User not found." };
  }

  let stripeCustomerId = user.subscription?.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: user.name,
    });
    stripeCustomerId = customer.id;
    await User.findByIdAndUpdate(user._id, { "subscription.stripeCustomerId": stripeCustomerId });
  }

  try {
    const stripeSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: absoluteUrl("/account?success=true"),
      cancel_url: absoluteUrl("/account?canceled=true"),
      metadata: {
        userId: user._id.toString(),
      },
    });

    if (stripeSession.url) {
      return { url: stripeSession.url };
    } else {
      return { error: "Could not create Stripe session." };
    }
  } catch (error) {
    console.error("Stripe error:", error);
    return { error: "An error occurred while creating the payment session." };
  }
}

/**
 * Creates a Stripe Customer Portal session to allow users to manage their subscription.
 */
export async function manageSubscription() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return { error: "You must be logged in." }
  }

  await connectMongoDB()
  const user = await User.findOne({ email: session.user.email })
  if (!user || !user.subscription?.stripeCustomerId) {
    return { error: "Stripe customer not found." }
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.subscription.stripeCustomerId,
    return_url: absoluteUrl("/account"),
  })

  if (portalSession.url) {
    redirect(portalSession.url)
  } else {
    return { error: "Could not create portal session." }
  }
}
