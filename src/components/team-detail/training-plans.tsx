"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Calendar,
  Plus,
  MoreVertical,
  Edit,
  Archive,
  ArchiveRestore,
  Check,
  Trash2,
} from "lucide-react";

interface Plan {
  planName: string;
  planDuration: number;
  planProgressCall: number;
  planRenewalCall: number;
  planUpdateWeek: number;
  planColor: string;
  isActive: boolean;
  createdAt: string;
}

interface PlanFormData {
  planName: string;
  planDuration: string;
  planProgressCall: string;
  planRenewalCall: string;
  planUpdateWeek: string;
  planColor: string;
}

interface TrainingPlansProps {
  plans: Plan[];
  teamId: string;
  onPlansUpdated: () => void;
}

// Color palette with 12 complementing colors
const COLOR_PALETTE = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Yellow", value: "#eab308" },
  { name: "Emerald", value: "#059669" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Violet", value: "#7c3aed" },
];

export function TrainingPlans({
  plans,
  teamId,
  onPlansUpdated,
}: TrainingPlansProps) {
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editPlanDialogOpen, setEditPlanDialogOpen] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [editingPlanIndex, setEditingPlanIndex] = useState<number | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormData>({
    planName: "",
    planDuration: "",
    planProgressCall: "",
    planRenewalCall: "",
    planUpdateWeek: "",
    planColor: "#3b82f6",
  });

  const resetPlanForm = () => {
    setPlanForm({
      planName: "",
      planDuration: "",
      planProgressCall: "",
      planRenewalCall: "",
      planUpdateWeek: "",
      planColor: "#3b82f6",
    });
  };

  const validatePlanForm = (
    planName: string,
    duration: number,
    progressCall: number,
    renewalCall: number,
    updateWeek: number,
    isEdit = false,
    originalPlanName = ""
  ) => {
    if (!planName.trim()) {
      toast.error("Plan name is required");
      return false;
    }

    if (!duration || duration < 1) {
      toast.error("Plan duration must be at least 1 week");
      return false;
    }

    if (!progressCall || progressCall < 1 || progressCall > duration) {
      toast.error(`Progress call week must be between 1 and ${duration}`);
      return false;
    }

    if (!renewalCall || renewalCall < 1 || renewalCall > duration) {
      toast.error(`Renewal call week must be between 1 and ${duration}`);
      return false;
    }

    if (!updateWeek || updateWeek < 1 || updateWeek > duration) {
      toast.error(`Plan update week must be between 1 and ${duration}`);
      return false;
    }

    // Check if plan name already exists (skip if editing the same plan)
    const planExists = plans.some(
      (plan) =>
        plan.planName.toLowerCase() === planName.toLowerCase() &&
        (!isEdit ||
          plan.planName.toLowerCase() !== originalPlanName.toLowerCase())
    );
    if (planExists) {
      toast.error("A plan with this name already exists");
      return false;
    }

    return true;
  };

  const createPlan = async () => {
    const {
      planName,
      planDuration,
      planProgressCall,
      planRenewalCall,
      planUpdateWeek,
      planColor,
    } = planForm;
    const duration = Number.parseInt(planDuration);
    const progressCall = Number.parseInt(planProgressCall);
    const renewalCall = Number.parseInt(planRenewalCall);
    const updateWeek = Number.parseInt(planUpdateWeek);

    if (
      !validatePlanForm(
        planName,
        duration,
        progressCall,
        renewalCall,
        updateWeek
      )
    ) {
      return;
    }

    setCreatingPlan(true);
    try {
      const newPlan = {
        planName: planName.trim(),
        planDuration: duration,
        planProgressCall: progressCall,
        planRenewalCall: renewalCall,
        planUpdateWeek: updateWeek,
        planColor: planColor,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const updatedPlans = [...plans, newPlan];

      const response = await fetch("/api/teams/update-team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          plans: updatedPlans,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        resetPlanForm();
        setPlanDialogOpen(false);
        onPlansUpdated();
        toast.success("Training plan created successfully");
      } else {
        toast.error(data.error || "Failed to create training plan");
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      toast.error("Failed to create training plan");
    }
    setCreatingPlan(false);
  };

  const editPlan = (planIndex: number) => {
    const plan = plans[planIndex];
    setPlanForm({
      planName: plan.planName,
      planDuration: plan.planDuration.toString(),
      planProgressCall: plan.planProgressCall.toString(),
      planRenewalCall: plan.planRenewalCall.toString(),
      planUpdateWeek: plan.planUpdateWeek.toString(),
      planColor: plan.planColor || "#3b82f6",
    });
    setEditingPlanIndex(planIndex);
    setEditPlanDialogOpen(true);
  };

  const updatePlan = async () => {
    if (editingPlanIndex === null) return;

    const {
      planName,
      planDuration,
      planProgressCall,
      planRenewalCall,
      planUpdateWeek,
      planColor,
    } = planForm;
    const duration = Number.parseInt(planDuration);
    const progressCall = Number.parseInt(planProgressCall);
    const renewalCall = Number.parseInt(planRenewalCall);
    const updateWeek = Number.parseInt(planUpdateWeek);

    const originalPlan = plans[editingPlanIndex];
    if (
      !validatePlanForm(
        planName,
        duration,
        progressCall,
        renewalCall,
        updateWeek,
        true,
        originalPlan.planName
      )
    ) {
      return;
    }

    setUpdatingPlan(true);
    try {
      const updatedPlans = [...plans];
      updatedPlans[editingPlanIndex] = {
        ...originalPlan,
        planName: planName.trim(),
        planDuration: duration,
        planProgressCall: progressCall,
        planRenewalCall: renewalCall,
        planUpdateWeek: updateWeek,
        planColor: planColor,
      };

      const response = await fetch("/api/teams/update-team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          plans: updatedPlans,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        resetPlanForm();
        setEditPlanDialogOpen(false);
        setEditingPlanIndex(null);
        onPlansUpdated();
        toast.success("Training plan updated successfully");
      } else {
        toast.error(data.error || "Failed to update training plan");
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Failed to update training plan");
    }
    setUpdatingPlan(false);
  };

  const togglePlanStatus = async (planIndex: number) => {
    const updatedPlans = [...plans];
    const plan = updatedPlans[planIndex];
    const newStatus = !plan.isActive;

    updatedPlans[planIndex] = {
      ...plan,
      isActive: newStatus,
    };

    try {
      const response = await fetch("/api/teams/update-team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          plans: updatedPlans,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onPlansUpdated();
        toast.success(
          `Plan ${newStatus ? "activated" : "deactivated"} successfully`
        );
      } else {
        toast.error(data.error || "Failed to update plan status");
      }
    } catch (error) {
      console.error("Error updating plan status:", error);
      toast.error("Failed to update plan status");
    }
  };

  const deletePlan = async (planIndex: number) => {
    const planToDelete = plans[planIndex];

    if (
      !confirm(
        `Are you sure you want to permanently delete the plan "${planToDelete.planName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const updatedPlans = plans.filter((_, index) => index !== planIndex);

      const response = await fetch("/api/teams/update-team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          plans: updatedPlans,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onPlansUpdated();
        toast.success(`Plan "${planToDelete.planName}" deleted successfully`);
      } else {
        toast.error(data.error || "Failed to delete plan");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    }
  };

  const ColorPicker = ({
    selectedColor,
    onColorChange,
  }: {
    selectedColor: string;
    onColorChange: (color: string) => void;
  }) => (
    <div>
      <Label>Plan Color</Label>
      <div className="grid grid-cols-6 gap-2 mt-2">
        {COLOR_PALETTE.map((color) => (
          <button
            key={color.value}
            type="button"
            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
              selectedColor === color.value
                ? "border-gray-900 ring-2 ring-gray-300"
                : "border-gray-300"
            }`}
            style={{ backgroundColor: color.value }}
            onClick={() => onColorChange(color.value)}
            title={color.name}
          >
            {selectedColor === color.value && (
              <Check className="w-4 h-4 text-white mx-auto" />
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Choose a color to identify this plan
      </p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Training Plans
          </CardTitle>
          <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Training Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="add-planName">Plan Name *</Label>
                  <Input
                    id="add-planName"
                    value={planForm.planName}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        planName: e.target.value,
                      }))
                    }
                    placeholder="e.g., 12 Week Transformation"
                  />
                </div>
                <div>
                  <Label htmlFor="add-planDuration">
                    Plan Duration (weeks) *
                  </Label>
                  <Input
                    id="add-planDuration"
                    type="number"
                    min="1"
                    value={planForm.planDuration}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        planDuration: e.target.value,
                      }))
                    }
                    placeholder="e.g., 12"
                  />
                </div>
                <div>
                  <Label htmlFor="add-planProgressCall">
                    Progress Call Week *
                  </Label>
                  <Input
                    id="add-planProgressCall"
                    type="number"
                    min="1"
                    value={planForm.planProgressCall}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        planProgressCall: e.target.value,
                      }))
                    }
                    placeholder="e.g., 4"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Which week should the progress call be scheduled?
                  </p>
                </div>
                <div>
                  <Label htmlFor="add-planRenewalCall">
                    Renewal Call Week *
                  </Label>
                  <Input
                    id="add-planRenewalCall"
                    type="number"
                    min="1"
                    value={planForm.planRenewalCall}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        planRenewalCall: e.target.value,
                      }))
                    }
                    placeholder="e.g., 10"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Which week should the renewal call be scheduled?
                  </p>
                </div>
                <div>
                  <Label htmlFor="add-planUpdateWeek">Plan Update Week *</Label>
                  <Input
                    id="add-planUpdateWeek"
                    type="number"
                    min="1"
                    value={planForm.planUpdateWeek}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        planUpdateWeek: e.target.value,
                      }))
                    }
                    placeholder="e.g., 6"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Which week should the plan be updated?
                  </p>
                </div>
                <ColorPicker
                  selectedColor={planForm.planColor}
                  onColorChange={(color) =>
                    setPlanForm((prev) => ({ ...prev, planColor: color }))
                  }
                />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPlanDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createPlan} disabled={creatingPlan}>
                    {creatingPlan ? "Creating..." : "Create Plan"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {plans.length === 0 ? (
            <p className="text-sm text-gray-500">No plans created</p>
          ) : (
            plans.map((plan, index) => (
              <div
                key={`plan-${plan.planName}-${index}`}
                className="text-sm border rounded p-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        style={{
                          backgroundColor: plan.planColor || "#3b82f6",
                          color: "white",
                          border: "none",
                        }}
                      >
                        {plan.planName}
                      </Badge>
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {plan.planDuration} weeks • Progress: Week{" "}
                      {plan.planProgressCall} • Renewal: Week{" "}
                      {plan.planRenewalCall}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => editPlan(index)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Plan
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePlanStatus(index)}>
                        {plan.isActive ? (
                          <>
                            <Archive className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ArchiveRestore className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deletePlan(index)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Plan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Edit Plan Dialog */}
      <Dialog open={editPlanDialogOpen} onOpenChange={setEditPlanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Training Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-planName">Plan Name *</Label>
              <Input
                id="edit-planName"
                value={planForm.planName}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, planName: e.target.value }))
                }
                placeholder="e.g., 12 Week Transformation"
              />
            </div>
            <div>
              <Label htmlFor="edit-planDuration">Plan Duration (weeks) *</Label>
              <Input
                id="edit-planDuration"
                type="number"
                min="1"
                value={planForm.planDuration}
                onChange={(e) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    planDuration: e.target.value,
                  }))
                }
                placeholder="e.g., 12"
              />
            </div>
            <div>
              <Label htmlFor="edit-planProgressCall">
                Progress Call Week *
              </Label>
              <Input
                id="edit-planProgressCall"
                type="number"
                min="1"
                value={planForm.planProgressCall}
                onChange={(e) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    planProgressCall: e.target.value,
                  }))
                }
                placeholder="e.g., 4"
              />
              <p className="text-xs text-gray-500 mt-1">
                Which week should the progress call be scheduled?
              </p>
            </div>
            <div>
              <Label htmlFor="edit-planRenewalCall">Renewal Call Week *</Label>
              <Input
                id="edit-planRenewalCall"
                type="number"
                min="1"
                value={planForm.planRenewalCall}
                onChange={(e) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    planRenewalCall: e.target.value,
                  }))
                }
                placeholder="e.g., 10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Which week should the renewal call be scheduled?
              </p>
            </div>
            <div>
              <Label htmlFor="edit-planUpdateWeek">Plan Update Week *</Label>
              <Input
                id="edit-planUpdateWeek"
                type="number"
                min="1"
                value={planForm.planUpdateWeek}
                onChange={(e) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    planUpdateWeek: e.target.value,
                  }))
                }
                placeholder="e.g., 6"
              />
              <p className="text-xs text-gray-500 mt-1">
                Which week should the plan be updated?
              </p>
            </div>
            <ColorPicker
              selectedColor={planForm.planColor}
              onColorChange={(color) =>
                setPlanForm((prev) => ({ ...prev, planColor: color }))
              }
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditPlanDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={updatePlan} disabled={updatingPlan}>
                {updatingPlan ? "Updating..." : "Update Plan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
