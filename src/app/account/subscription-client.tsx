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
  cancelAtPeriodEnd?: boolean;
  scheduledPlanChange?: {
    newPlanId: string;
    effectiveDate: Date;
  };
  currentPeriodEnd?: Date;
};

export function SubscriptionClient({
  currentPlanId,
  cancelAtPeriodEnd,
  scheduledPlanChange,
  currentPeriodEnd,
}: SubscriptionClientProps) {
  console.log("[v0] === SUBSCRIPTION CLIENT PROPS DEBUG ===");
  console.log("[v0] currentPlanId:", currentPlanId);
  console.log("[v0] cancelAtPeriodEnd:", cancelAtPeriodEnd);
  console.log("[v0] scheduledPlanChange:", scheduledPlanChange);
  console.log(
    "[v0] scheduledPlanChange?.effectiveDate:",
    scheduledPlanChange?.effectiveDate
  );
  console.log("[v0] currentPeriodEnd:", currentPeriodEnd);

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

  const isDowngrade = (targetPlanId: string) => {
    const currentLevel =
      planHierarchy[currentPlanId as keyof typeof planHierarchy] ?? 0;
    const targetLevel =
      planHierarchy[targetPlanId as keyof typeof planHierarchy] ?? 0;
    return targetLevel < currentLevel;
  };

  const canDowngradeTo = (targetPlanId: string) => {
    if (!userUsage) return true; // Allow if no usage data

    const targetPlan = plans.find((p) => p.id === targetPlanId);
    if (!targetPlan) return false;

    const teamLimit =
      targetPlan.limits.teams === -1
        ? Number.POSITIVE_INFINITY
        : targetPlan.limits.teams;
    const clientLimit =
      targetPlan.limits.clients === -1
        ? Number.POSITIVE_INFINITY
        : targetPlan.limits.clients;

    return userUsage.teams <= teamLimit && userUsage.clients <= clientLimit;
  };

  const getDowngradeMessage = (targetPlanId: string) => {
    if (!userUsage) return "";

    const targetPlan = plans.find((p) => p.id === targetPlanId);
    if (!targetPlan) return "";

    const teamLimit =
      targetPlan.limits.teams === -1
        ? "unlimited"
        : targetPlan.limits.teams.toString();
    const clientLimit =
      targetPlan.limits.clients === -1
        ? "unlimited"
        : targetPlan.limits.clients.toString();

    const excessTeams =
      targetPlan.limits.teams === -1
        ? 0
        : Math.max(0, userUsage.teams - targetPlan.limits.teams);
    const excessClients =
      targetPlan.limits.clients === -1
        ? 0
        : Math.max(0, userUsage.clients - targetPlan.limits.clients);

    if (excessTeams > 0 || excessClients > 0) {
      let message = `${targetPlan.name} allows ${teamLimit} teams and ${clientLimit} clients. You have ${userUsage.teams} teams and ${userUsage.clients} clients. `;

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

    if (
      action === "Change" &&
      isDowngrade(targetPlanId) &&
      !canDowngradeTo(targetPlanId)
    ) {
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

  const currentPlan = plans.find((p) => p.id === currentPlanId);
  const scheduledPlan = scheduledPlanChange
    ? plans.find((p) => p.id === scheduledPlanChange.newPlanId)
    : null;

  console.log("[v0] === PLAN DATA DEBUG ===");
  console.log("[v0] currentPlan:", currentPlan);
  console.log("[v0] scheduledPlan:", scheduledPlan);
  console.log("[v0] scheduledPlan pricing:", scheduledPlan?.pricing);
  console.log(
    "[v0] scheduledPlan monthly price:",
    scheduledPlan?.pricing.monthly.price
  );
  console.log(
    "[v0] scheduledPlan annually price:",
    scheduledPlan?.pricing.annually?.price
  );

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
            <div className="space-y-3">
              <div>
                You are currently on the <strong>{currentPlanName}</strong>{" "}
                plan.
              </div>

              {/* Usage display */}
              {userUsage && !isFreePlan && (
                <div className="flex gap-4 text-sm">
                  <span>
                    Teams: <strong>{userUsage.teams}</strong>
                    {currentPlan && currentPlan.limits.teams !== -1 && (
                      <span className="text-muted-foreground">
                        {" "}
                        / {currentPlan.limits.teams}
                      </span>
                    )}
                    {currentPlan && currentPlan.limits.teams === -1 && (
                      <span className="text-muted-foreground">
                        {" "}
                        / unlimited
                      </span>
                    )}
                  </span>
                  <span>
                    Clients: <strong>{userUsage.clients}</strong>
                    {currentPlan && currentPlan.limits.clients !== -1 && (
                      <span className="text-muted-foreground">
                        {" "}
                        / {currentPlan.limits.clients}
                      </span>
                    )}
                    {currentPlan && currentPlan.limits.clients === -1 && (
                      <span className="text-muted-foreground">
                        {" "}
                        / unlimited
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Current billing period and pricing */}
              {!isFreePlan && currentPeriodEnd && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm text-blue-800 space-y-1">
                    <pre className="mb-2">
                      Come back to this and ensure we show all relevant and
                      accurate billing information + renewall, end and downgrate
                      dates
                    </pre>
                    {currentPlan && (
                      <div>
                        Current billing:{" "}
                        <strong>
                          $
                          {billingInterval === "monthly"
                            ? currentPlan.pricing.monthly.price
                            : currentPlan.pricing.annually?.price ||
                              currentPlan.pricing.monthly.price}
                          /{billingInterval}
                        </strong>
                      </div>
                    )}
                    <div>
                      Your subscription renews on{" "}
                      <strong>
                        {new Date(currentPeriodEnd).toLocaleDateString()}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Scheduled plan changes */}
              {scheduledPlanChange && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  {console.log(
                    "[v0] === RENDERING SCHEDULED PLAN CHANGES SECTION ==="
                  )}
                  <div className="text-sm text-orange-800 space-y-2">
                    <div>
                      <strong>
                        Your subscription will be changed on{" "}
                        {new Date(
                          scheduledPlanChange.effectiveDate
                        ).toLocaleDateString()}
                      </strong>
                    </div>

                    {scheduledPlan && (
                      <div className="space-y-1">
                        <div>
                          Your next estimated payment will be{" "}
                          <strong>
                            $
                            {billingInterval === "monthly"
                              ? scheduledPlan.pricing.monthly.price
                              : scheduledPlan.pricing.annually?.price ||
                                scheduledPlan.pricing.monthly.price}
                          </strong>
                        </div>

                        <div className="pt-2 border-t border-orange-200">
                          <div className="font-medium text-orange-900 mb-1">
                            Billing Details:
                          </div>
                          <div className="flex justify-between items-center">
                            <span>
                              {new Date(
                                scheduledPlanChange.effectiveDate
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(
                                new Date(
                                  scheduledPlanChange.effectiveDate
                                ).setMonth(
                                  new Date(
                                    scheduledPlanChange.effectiveDate
                                  ).getMonth() +
                                    (billingInterval === "monthly" ? 1 : 12)
                                )
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>{scheduledPlan.name}</span>
                            <span>
                              $
                              {billingInterval === "monthly"
                                ? scheduledPlan.pricing.monthly.price
                                : scheduledPlan.pricing.annually?.price ||
                                  scheduledPlan.pricing.monthly.price}
                            </span>
                          </div>
                          <div className="flex justify-between items-center font-medium pt-1 border-t border-orange-200">
                            <span>Total</span>
                            <span>
                              $
                              {billingInterval === "monthly"
                                ? scheduledPlan.pricing.monthly.price
                                : scheduledPlan.pricing.annually?.price ||
                                  scheduledPlan.pricing.monthly.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cancellation notice */}
              {cancelAtPeriodEnd &&
                currentPeriodEnd &&
                !scheduledPlanChange && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="text-sm text-orange-800 space-y-1">
                      <div>
                        Your plan will switch to Free on{" "}
                        <strong>
                          {new Date(currentPeriodEnd).toLocaleDateString()}
                        </strong>{" "}
                        unless you resubscribe.
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        You'll maintain full access until this date.
                      </div>
                    </div>
                  </div>
                )}
            </div>
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
