import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongoDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { SubscriptionClient } from "./subscription-client";
import { plans } from "@/lib/plans";
import { redirect } from "next/navigation";

// Fetches the current user's subscription details from the database.
async function getUserSubscription() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  await connectMongoDB();
  // Fetch the user and ensure the subscription field is populated with defaults if it doesn't exist.
  const user = await User.findOne({ email: session.user.email }).lean();

  if (!user) {
    return null;
  }

  // Return a serializable object for the client component.
  return {
    planId: user.subscription?.planId || "free",
    status: user.subscription?.status || "active",
    activeBoltOnIds: user.activeBoltOnIds || [],
  };
}

export default async function AccountPage() {
  const subscription = await getUserSubscription();

  // If there's no subscription data, the user might not be logged in.
  if (!subscription) {
    redirect("/"); // Or redirect to a login page
  }

  return (
    <div className="container mx-auto py-8">
      <SubscriptionClient
        plans={plans}
        currentPlanId={subscription.planId as "free" | "basic" | "pro" | "team"}
        subscriptionStatus={subscription.status}
      />
    </div>
  );
}
