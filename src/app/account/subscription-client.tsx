"use client";

import { useState, useTransition, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [userUsage, setUserUsage] = useState<{
    teams: number;
    clients: number;
  } | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [downgradeMessage, setDowngradeMessage] = useState("");

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setIsLoadingUsage(true);

        const teamsResponse = await fetch("/api/teams/get-all-teams");
        const teamsData = await teamsResponse.json();

        if (teamsResponse.ok && teamsData.teams) {
          const teamCount = teamsData.teams.length;
          const clientCount = teamsData.teams.reduce(
            (total: number, team: any) => {
              return total + (team.clients?.length || 0);
            },
            0
          );

          setUserUsage({ teams: teamCount, clients: clientCount });

          console.log("=== USAGE FETCHED ===");
          console.log(`User has: ${teamCount} teams, ${clientCount} clients`);
        } else {
          setUserUsage({ teams: 0, clients: 0 });
        }
      } catch (error) {
        console.error("Error fetching usage:", error);
        setUserUsage({ teams: 0, clients: 0 });
      } finally {
        setIsLoadingUsage(false);
      }
    };

    fetchUsage();
  }, []);

  const planHierarchy = { free: 0, basic: 1, pro: 2, team: 3 };

  const getPlanAction = (targetPlanId: string) => {
    const currentLevel =
      planHierarchy[currentPlanId as keyof typeof planHierarchy] ?? 0;
    const targetLevel =
      planHierarchy[targetPlanId as keyof typeof planHierarchy] ?? 0;

    if (!currentPlanId || currentPlanId === "free") {
      return "Subscribe";
    } else if (targetLevel > currentLevel) {
      return "Change";
    } else {
      return "Change";
    }
  };

  const canDowngradeTo = (targetPlanId: string) => {
    if (!userUsage) return true; // Allow if no usage data

    const targetPlan = plans.find((p) => p.id === targetPlanId);
    if (!targetPlan) return false;

    return (
      userUsage.teams <= targetPlan.limits.teams &&
      userUsage.clients <= targetPlan.limits.clients
    );
  };

  const getDowngradeMessage = (targetPlanId: string) => {
    if (!userUsage) return "";

    const targetPlan = plans.find((p) => p.id === targetPlanId);
    if (!targetPlan) return "";

    const excessTeams = Math.max(0, userUsage.teams - targetPlan.limits.teams);
    const excessClients = Math.max(
      0,
      userUsage.clients - targetPlan.limits.clients
    );

    if (excessTeams > 0 || excessClients > 0) {
      let message = `${targetPlan.name} allows ${targetPlan.limits.teams} teams and ${targetPlan.limits.clients} clients. You have ${userUsage.teams} teams and ${userUsage.clients} clients. `;

      if (excessTeams > 0 && excessClients > 0) {
        message += `Remove ${excessTeams} teams and ${excessClients} clients to downgrade.`;
      } else if (excessTeams > 0) {
        message += `Remove ${excessTeams} teams to downgrade.`;
      } else {
        message += `Remove ${excessClients} clients to downgrade.`;
      }

      return message;
    }

    return "";
  };

  const handlePlanAction = async (priceId: string, targetPlanId: string) => {
    const action = getPlanAction(targetPlanId);

    if (action === "Change" && !canDowngradeTo(targetPlanId)) {
      const message = getDowngradeMessage(targetPlanId);
      setDowngradeMessage(message);
      setShowDowngradeModal(true);
      return;
    }

    setLoadingPriceId(priceId);

    try {
      if (!currentPlanId || currentPlanId === "free") {
        const res = await upgradePlan(priceId);
        if (res?.url) {
          window.location.href = res.url;
        } else if (res?.error) {
          console.error(res.error);
          setLoadingPriceId(null);
        }
      } else {
        await manageSubscription();
      }
    } catch (err) {
      console.error(err);
      setLoadingPriceId(null);
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

  if (isLoadingUsage) {
    return (
      <div className="w-full max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading subscription data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      <Dialog open={showDowngradeModal} onOpenChange={setShowDowngradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unable to Downgrade</DialogTitle>
            <DialogDescription>
              You need to reduce your usage before downgrading to this plan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">{downgradeMessage}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDowngradeModal(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          {plans.map((plan) => {
            if (plan.id === "free") {
              const isCurrentPlan = plan.id === currentPlanId || isFreePlan;

              return (
                <Card
                  key={plan.id}
                  className={isCurrentPlan ? "border-primary" : ""}
                >
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold">$0</span>
                      /month
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
                      disabled={isCurrentPlan}
                      variant={isCurrentPlan ? "secondary" : "default"}
                      onClick={() =>
                        !isCurrentPlan && handlePlanAction("", plan.id)
                      }
                    >
                      {isCurrentPlan
                        ? "Current Plan"
                        : `${getPlanAction(plan.id)} to ${plan.name}`}
                    </Button>
                  </CardFooter>
                </Card>
              );
            }

            const priceInfo =
              billingInterval === "annually" && plan.pricing.annually
                ? plan.pricing.annually
                : plan.pricing.monthly;

            if (!priceInfo) return null;

            const isCurrentPlan = plan.id === currentPlanId;

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
                    onClick={() =>
                      handlePlanAction(priceInfo.stripePriceId, plan.id)
                    }
                    disabled={
                      loadingPriceId === priceInfo.stripePriceId ||
                      isCurrentPlan
                    }
                  >
                    {loadingPriceId === priceInfo.stripePriceId && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isCurrentPlan
                      ? "Current Plan"
                      : `${getPlanAction(plan.id)} to ${plan.name}`}
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
