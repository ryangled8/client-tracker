import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongoDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { SubscriptionClient } from "./subscription-client";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";

async function getUserSubscription() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  await connectMongoDB();
  const user = (await User.findOne({
    email: session.user.email,
  }).lean()) as any;

  if (!user) {
    return null;
  }

  console.log("User subscription data:", {
    planId: user.subscription?.planId,
    status: user.subscription?.status,
    activeBoltOnIds: user.activeBoltOnIds || [],
    cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd,
    scheduledPlanChange: user.subscription?.scheduledPlanChange,
    currentPeriodEnd: user.subscription?.currentPeriodEnd,
  });

  return {
    planId: user.subscription?.planId || "free",
    status: user.subscription?.status || "active",
    activeBoltOnIds: user.activeBoltOnIds || [],
    cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
    scheduledPlanChange: user.subscription?.scheduledPlanChange,
    currentPeriodEnd: user.subscription?.currentPeriodEnd,
  };
}

export default async function AccountPage() {
  const subscription = await getUserSubscription();

  if (!subscription) {
    redirect("/");
  }

  return (
    <section className="container mx-auto py-8">
      <LogoutButton />

      <SubscriptionClient
        currentPlanId={subscription.planId as "free" | "basic" | "pro" | "team"}
        cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
        scheduledPlanChange={subscription.scheduledPlanChange}
        currentPeriodEnd={subscription.currentPeriodEnd}
      />
    </section>
  );
}
