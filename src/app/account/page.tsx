import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongoDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { SubscriptionClient } from "./subscription-client";
import { redirect } from "next/navigation";

async function getUserSubscription() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  await connectMongoDB();
  const user = await User.findOne({ email: session.user.email }).lean();

  if (!user) {
    return null;
  }

  return {
    planId: user.subscription?.planId || "free",
    status: user.subscription?.status || "active",
    activeBoltOnIds: user.activeBoltOnIds || [],
  };
}

export default async function AccountPage() {
  const subscription = await getUserSubscription();

  if (!subscription) {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-8">
      <SubscriptionClient
        currentPlanId={subscription.planId as "free" | "basic" | "pro" | "team"}
      />
    </div>
  );
}
