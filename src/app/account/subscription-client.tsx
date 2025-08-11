"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { plans } from "@/lib/plans";
import { manageSubscription, upgradePlan } from "./actions";

type SubscriptionClientProps = {
  currentPlanId: string | null | undefined;
};

export function SubscriptionClient({ currentPlanId }: SubscriptionClientProps) {
  const [billingInterval, setBillingInterval] = useState<
    "monthly" | "annually"
  >("monthly");
  const [isPending, startTransition] = useTransition();
  // State to track which specific price ID is being loaded
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handlePlanAction = async (priceId: string) => {
    setLoadingPriceId(priceId);

    try {
      const res = await upgradePlan(priceId);

      if (res?.url) {
        window.location.href = res.url; // go to Stripe checkout
      } else if (res?.error) {
        console.error(res.error);
        setLoadingPriceId(null); // reset on error
      }
    } catch (err) {
      console.error(err);
      setLoadingPriceId(null); // reset if something crashes
    }
  };

  const handleManageAction = () => {
    startTransition(async () => {
      await manageSubscription();
    });
  };

  const isFreePlan = !currentPlanId || currentPlanId === "free";
  const currentPlanName = isFreePlan
    ? "Free"
    : plans.find((p) => p.id === currentPlanId)?.name;

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            You are currently on the <strong>{currentPlanName}</strong> plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isFreePlan ? (
            <Button onClick={handleManageAction} disabled={isPending}>
              {isPending && !loadingPriceId && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Manage Subscription in Stripe
            </Button>
          ) : (
            <p>Upgrade your plan to unlock more features.</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Label htmlFor="billing-interval">Monthly</Label>
          <Switch
            id="billing-interval"
            checked={billingInterval === "annually"}
            onCheckedChange={(checked) =>
              setBillingInterval(checked ? "annually" : "monthly")
            }
          />
          <Label htmlFor="billing-interval">Annually (Save 2 months)</Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans
            .filter((plan) => plan.id !== "free")
            .map((plan) => {
              const priceInfo =
                billingInterval === "annually" && plan.pricing.annually
                  ? plan.pricing.annually
                  : plan.pricing.monthly;

              // Skip rendering if the selected interval doesn't have a price
              if (!priceInfo) return null;

              const isCurrentPlan = plan.id === currentPlanId;
              const isLoading = loadingPriceId === priceInfo.stripePriceId;

              return (
                <Card
                  key={plan.id}
                  className={isCurrentPlan ? "border-primary" : ""}
                >
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold">
                        ${priceInfo.price}
                      </span>
                      /{billingInterval === "annually" ? "year" : "month"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handlePlanAction(priceInfo.stripePriceId)}
                      disabled={
                        loadingPriceId === priceInfo.stripePriceId ||
                        isCurrentPlan
                      }
                    >
                      {loadingPriceId === priceInfo.stripePriceId && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isCurrentPlan ? "Current Plan" : "Upgrade"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}
