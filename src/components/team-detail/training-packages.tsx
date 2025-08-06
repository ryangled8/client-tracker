"use client";

import type React from "react";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Check, Info } from "lucide-react";
import { generateExampleDates } from "@/utils/dateCalculations";
import { TrainingPackageCard } from "./training-package-card";

interface Package {
  packageName: string;
  durationInWeeks: number;
  progressIntervalInWeeks: number;
  planUpdateIntervalInWeeks: number;
  renewalCallWeeksBeforeEnd: number;
  packageColor?: string;
  isActive: boolean;
  isRecurring: boolean;
  createdAt: string;
}

interface PackageFormData {
  packageName: string;
  durationInWeeks: string;
  progressIntervalInWeeks: string;
  planUpdateIntervalInWeeks: string;
  renewalCallWeeksBeforeEnd: string;
  packageColor: string;
  isRecurring: boolean;
}

interface ExampleSchedule {
  progressCallWeeks: number[];
  planUpdateWeeks: number[];
  renewalCallWeek: number;
}

interface TrainingPackagesProps {
  packages: Package[];
  teamId: string;
  onPackagesUpdated: () => void;
  hidePackageList?: boolean;
  hideCreatePackageButton?: boolean;
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

// Move this function outside the component to prevent re-creation on every render
const generateExampleText = (
  durationInWeeks: string,
  progressIntervalInWeeks: string,
  planUpdateIntervalInWeeks: string,
  renewalCallWeeksBeforeEnd: string
): ExampleSchedule | null => {
  const duration = Number.parseInt(durationInWeeks) || 0;
  const progressInterval = Number.parseInt(progressIntervalInWeeks) || 0;
  const planUpdateInterval = Number.parseInt(planUpdateIntervalInWeeks) || 0;
  const renewalWeeks = Number.parseInt(renewalCallWeeksBeforeEnd) || 2;

  if (duration > 0 && progressInterval > 0 && planUpdateInterval > 0) {
    const example = generateExampleDates(
      duration,
      progressInterval,
      planUpdateInterval,
      renewalWeeks
    );
    return {
      progressCallWeeks: example.progressCallWeeks,
      planUpdateWeeks: example.planUpdateWeeks,
      renewalCallWeek: example.renewalCallWeek,
    };
  }
  return null;
};

export function TrainingPackages({
  packages,
  teamId,
  onPackagesUpdated,
  hidePackageList,
  hideCreatePackageButton,
}: TrainingPackagesProps) {
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [editPackageDialogOpen, setEditPackageDialogOpen] = useState(false);
  const [creatingPackage, setCreatingPackage] = useState(false);
  const [updatingPackage, setUpdatingPackage] = useState(false);
  const [editingPackageIndex, setEditingPackageIndex] = useState<number | null>(
    null
  );
  const [packageForm, setPackageForm] = useState<PackageFormData>({
    packageName: "",
    durationInWeeks: "",
    progressIntervalInWeeks: "",
    planUpdateIntervalInWeeks: "",
    renewalCallWeeksBeforeEnd: "2",
    packageColor: "#3b82f6",
    isRecurring: false,
  });

  const resetPackageForm = () => {
    setPackageForm({
      packageName: "",
      durationInWeeks: "",
      progressIntervalInWeeks: "",
      planUpdateIntervalInWeeks: "",
      renewalCallWeeksBeforeEnd: "2",
      packageColor: "#3b82f6",
      isRecurring: false,
    });
  };

  const validatePackageForm = (
    packageName: string,
    duration: number,
    progressInterval: number,
    planUpdateInterval: number,
    renewalCallWeeks: number,
    isRecurring: boolean,
    isEdit = false,
    originalPackageName = ""
  ) => {
    if (!packageName.trim()) {
      toast.error("Package name is required");
      return false;
    }

    if (!progressInterval || progressInterval < 1) {
      toast.error("Progress call interval must be at least 1 week");
      return false;
    }

    if (!planUpdateInterval || planUpdateInterval < 1) {
      toast.error("Plan update interval must be at least 1 week");
      return false;
    }

    // Only validate duration and renewal call for non-recurring packages
    if (!isRecurring) {
      if (!duration || duration < 1) {
        toast.error("Package duration must be at least 1 week");
        return false;
      }

      if (
        !renewalCallWeeks ||
        renewalCallWeeks < 1 ||
        renewalCallWeeks >= duration
      ) {
        toast.error(
          `Renewal call must be between 1 and ${
            duration - 1
          } weeks before package end`
        );
        return false;
      }

      if (progressInterval > duration) {
        toast.error(
          "Progress call interval cannot be longer than package duration"
        );
        return false;
      }

      if (planUpdateInterval > duration) {
        toast.error(
          "Plan update interval cannot be longer than package duration"
        );
        return false;
      }
    }

    // Check if package name already exists (skip if editing the same package)
    const packageExists = packages.some(
      (pkg) =>
        pkg.packageName.toLowerCase() === packageName.toLowerCase() &&
        (!isEdit ||
          pkg.packageName.toLowerCase() !== originalPackageName.toLowerCase())
    );
    if (packageExists) {
      toast.error("A package with this name already exists");
      return false;
    }

    return true;
  };

  const createPackage = async () => {
    const {
      packageName,
      durationInWeeks,
      progressIntervalInWeeks,
      planUpdateIntervalInWeeks,
      renewalCallWeeksBeforeEnd,
      packageColor,
      isRecurring,
    } = packageForm;
    const duration = Number.parseInt(durationInWeeks) || 0;
    const progressInterval = Number.parseInt(progressIntervalInWeeks);
    const planUpdateInterval = Number.parseInt(planUpdateIntervalInWeeks);
    const renewalWeeks = Number.parseInt(renewalCallWeeksBeforeEnd) || 2;

    if (
      !validatePackageForm(
        packageName,
        duration,
        progressInterval,
        planUpdateInterval,
        renewalWeeks,
        isRecurring
      )
    ) {
      return;
    }

    setCreatingPackage(true);
    try {
      const newPackage = {
        packageName: packageName.trim(),
        durationInWeeks: isRecurring ? 0 : duration, // Set to 0 for recurring packages
        progressIntervalInWeeks: progressInterval,
        planUpdateIntervalInWeeks: planUpdateInterval,
        renewalCallWeeksBeforeEnd: isRecurring ? 0 : renewalWeeks, // Set to 0 for recurring packages
        packageColor: packageColor,
        isActive: true,
        isRecurring: isRecurring,
        createdAt: new Date().toISOString(),
      };

      const updatedPackages = [...packages, newPackage];

      const response = await fetch("/api/teams/update-team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          packages: updatedPackages,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        resetPackageForm();
        setPackageDialogOpen(false);
        onPackagesUpdated();
        toast.success("Training package created successfully");
      } else {
        toast.error(data.error || "Failed to create training package");
      }
    } catch (error) {
      console.error("Error creating package:", error);
      toast.error("Failed to create training package");
    }
    setCreatingPackage(false);
  };

  const editPackage = (packageIndex: number) => {
    const pkg = packages[packageIndex];
    setPackageForm({
      packageName: pkg.packageName,
      durationInWeeks: pkg.durationInWeeks.toString(),
      progressIntervalInWeeks: pkg.progressIntervalInWeeks.toString(),
      renewalCallWeeksBeforeEnd: pkg.renewalCallWeeksBeforeEnd.toString(),
      planUpdateIntervalInWeeks: pkg.planUpdateIntervalInWeeks.toString(),
      packageColor: pkg.packageColor || "#3b82f6",
      isRecurring: pkg.isRecurring || false,
    });
    setEditingPackageIndex(packageIndex);
    setEditPackageDialogOpen(true);
  };

  const updatePackage = async () => {
    if (editingPackageIndex === null) return;

    const {
      packageName,
      durationInWeeks,
      progressIntervalInWeeks,
      planUpdateIntervalInWeeks,
      renewalCallWeeksBeforeEnd,
      packageColor,
      isRecurring,
    } = packageForm;
    const duration = Number.parseInt(durationInWeeks) || 0;
    const progressInterval = Number.parseInt(progressIntervalInWeeks);
    const planUpdateInterval = Number.parseInt(planUpdateIntervalInWeeks);
    const renewalWeeks = Number.parseInt(renewalCallWeeksBeforeEnd) || 2;

    const originalPackage = packages[editingPackageIndex];
    if (
      !validatePackageForm(
        packageName,
        duration,
        progressInterval,
        planUpdateInterval,
        renewalWeeks,
        isRecurring,
        true,
        originalPackage.packageName
      )
    ) {
      return;
    }

    setUpdatingPackage(true);
    try {
      const updatedPackages = [...packages];

      // Preserve the original package name for client references if only non-name fields changed
      const isNameChanged = packageName.trim() !== originalPackage.packageName;

      updatedPackages[editingPackageIndex] = {
        ...originalPackage,
        packageName: packageName.trim(),
        durationInWeeks: isRecurring ? 0 : duration,
        progressIntervalInWeeks: progressInterval,
        planUpdateIntervalInWeeks: planUpdateInterval,
        renewalCallWeeksBeforeEnd: isRecurring ? 0 : renewalWeeks,
        packageColor: packageColor || originalPackage.packageColor || "#3b82f6",
        isRecurring: isRecurring,
      };

      const response = await fetch("/api/teams/update-team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          packages: updatedPackages,
          // Include a flag to indicate if we need to update client package references
          updateClientPackageReferences: isNameChanged
            ? {
                oldPackageName: originalPackage.packageName,
                newPackageName: packageName.trim(),
              }
            : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        resetPackageForm();
        setEditPackageDialogOpen(false);
        setEditingPackageIndex(null);
        onPackagesUpdated();
        toast.success("Training package updated successfully");
      } else {
        toast.error(data.error || "Failed to update training package");
      }
    } catch (error) {
      console.error("Error updating package:", error);
      toast.error("Failed to update training package");
    }
    setUpdatingPackage(false);
  };

  const togglePackageStatus = async (packageIndex: number) => {
    const updatedPackages = [...packages];
    const pkg = updatedPackages[packageIndex];
    const newStatus = !pkg.isActive;

    updatedPackages[packageIndex] = {
      ...pkg,
      isActive: newStatus,
    };

    try {
      const response = await fetch("/api/teams/update-team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          packages: updatedPackages,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onPackagesUpdated();
        toast.success(
          `Package ${newStatus ? "activated" : "deactivated"} successfully`
        );
      } else {
        toast.error(data.error || "Failed to update package status");
      }
    } catch (error) {
      console.error("Error updating package status:", error);
      toast.error("Failed to update package status");
    }
  };

  const deletePackage = async (packageIndex: number) => {
    const packageToDelete = packages[packageIndex];

    if (
      !confirm(
        `Are you sure you want to permanently delete the package "${packageToDelete.packageName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const updatedPackages = packages.filter(
        (_, index) => index !== packageIndex
      );

      const response = await fetch("/api/teams/update-team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          packages: updatedPackages,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onPackagesUpdated();
        toast.success(
          `Package "${packageToDelete.packageName}" deleted successfully`
        );
      } else {
        toast.error(data.error || "Failed to delete package");
      }
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package");
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
      <Label>Package Color</Label>
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
        Choose a color to identify this package
      </p>
    </div>
  );

  // Replace the existing getExampleText function with this memoized version
  const exampleText = useMemo(() => {
    if (packageForm.isRecurring) return null; // Don't show example for recurring packages
    return generateExampleText(
      packageForm.durationInWeeks,
      packageForm.progressIntervalInWeeks,
      packageForm.planUpdateIntervalInWeeks,
      packageForm.renewalCallWeeksBeforeEnd
    );
  }, [
    packageForm.durationInWeeks,
    packageForm.progressIntervalInWeeks,
    packageForm.planUpdateIntervalInWeeks,
    packageForm.renewalCallWeeksBeforeEnd,
    packageForm.isRecurring,
  ]);

  return (
    <div>
      <div>
        <div className="flex items-center justify-between">
          {!hidePackageList && (
            <div className="text-blk-60 mb-2 text-sm">Training Packages</div>
          )}

          {!hideCreatePackageButton && (
            <Dialog
              open={packageDialogOpen}
              onOpenChange={setPackageDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">
                  <Plus className="h-4 w-4" />
                  Create Package
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
        </div>
      </div>

      {!hidePackageList && (
        <div>
          <div className="space-y-4">
            {packages.length === 0 ? (
              <p className="text-sm text-gray-500">No packages created</p>
            ) : (
              <>
                {/* Show packages in card layout */}
                <div className="grid grid-cols-2 gap-4">
                  {packages.map((pkg, index) => (
                    <TrainingPackageCard
                      key={`package-${pkg.packageName}-${index}`}
                      package={pkg}
                      packageIndex={index}
                      onEdit={editPackage}
                      onToggleStatus={togglePackageStatus}
                      onDelete={deletePackage}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      <PackageModal
        isEdit={false}
        open={packageDialogOpen}
        onOpenChange={setPackageDialogOpen}
        packageForm={packageForm}
        setPackageForm={setPackageForm}
        createPackage={createPackage}
        creatingPackage={creatingPackage}
        ColorPicker={ColorPicker}
        exampleText={exampleText}
      />

      {/* Edit Package Modal */}
      <PackageModal
        isEdit={true}
        open={editPackageDialogOpen}
        onOpenChange={setEditPackageDialogOpen}
        packageForm={packageForm}
        setPackageForm={setPackageForm}
        updatePackage={updatePackage}
        updatingPackage={updatingPackage}
        ColorPicker={ColorPicker}
        exampleText={exampleText}
      />
    </div>
  );
}

const PackageModal = ({
  isEdit = false,
  open,
  onOpenChange,
  packageForm,
  setPackageForm,
  createPackage,
  updatePackage,
  creatingPackage,
  updatingPackage,
  ColorPicker,
  exampleText,
}: {
  isEdit?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageForm: PackageFormData;
  setPackageForm: React.Dispatch<React.SetStateAction<PackageFormData>>;
  createPackage?: () => Promise<void>;
  updatePackage?: () => Promise<void>;
  creatingPackage?: boolean;
  updatingPackage?: boolean;
  ColorPicker: React.FC<{
    selectedColor: string;
    onColorChange: (color: string) => void;
  }>;
  exampleText: ExampleSchedule | null;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Edit Package" : "Create New Training Package"}
        </DialogTitle>
        <p className="text-sm text-gray-600 mt-2">
          Define a custom package with specific duration and call schedules
        </p>
      </DialogHeader>
      <div className="space-y-6 pt-4">
        <div>
          <Label htmlFor={`${isEdit ? "edit" : "add"}-packageName`}>
            Package Name *
          </Label>
          <Input
            id={`${isEdit ? "edit" : "add"}-packageName`}
            value={packageForm.packageName}
            onChange={(e) =>
              setPackageForm((prev: PackageFormData) => ({
                ...prev,
                packageName: e.target.value,
              }))
            }
            placeholder="e.g., 12 Week Transformation Package"
          />
        </div>

        {/* Recurring Package Toggle - moved under package name */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor={`${isEdit ? "edit" : "add"}-isRecurring`}>
              Recurring Package
            </Label>
            <p className="text-xs text-gray-500">
              Recurring packages automatically renew without a renewal call
            </p>
          </div>
          <Switch
            id={`${isEdit ? "edit" : "add"}-isRecurring`}
            checked={packageForm.isRecurring}
            onCheckedChange={(checked) =>
              setPackageForm((prev: PackageFormData) => ({
                ...prev,
                isRecurring: checked,
              }))
            }
          />
        </div>

        {/* Conditionally show duration field only for non-recurring packages */}
        {!packageForm.isRecurring && (
          <div>
            <Label htmlFor={`${isEdit ? "edit" : "add"}-durationInWeeks`}>
              Duration of package (weeks) *
            </Label>
            <Input
              id={`${isEdit ? "edit" : "add"}-durationInWeeks`}
              type="number"
              min="1"
              value={packageForm.durationInWeeks}
              onChange={(e) =>
                setPackageForm((prev: PackageFormData) => ({
                  ...prev,
                  durationInWeeks: e.target.value,
                }))
              }
              placeholder="e.g., 12"
            />
          </div>
        )}

        <div>
          <Label htmlFor={`${isEdit ? "edit" : "add"}-progressIntervalInWeeks`}>
            Progress Call Interval (weeks) *
          </Label>
          <Input
            id={`${isEdit ? "edit" : "add"}-progressIntervalInWeeks`}
            type="number"
            min="1"
            value={packageForm.progressIntervalInWeeks}
            onChange={(e) =>
              setPackageForm((prev: PackageFormData) => ({
                ...prev,
                progressIntervalInWeeks: e.target.value,
              }))
            }
            placeholder="e.g., 10"
          />
          <p className="text-xs text-gray-500 mt-1">
            How often progress calls occur (starting from start date)
          </p>
        </div>

        <div>
          <Label
            htmlFor={`${isEdit ? "edit" : "add"}-planUpdateIntervalInWeeks`}
          >
            Plan Update Interval (weeks) *
          </Label>
          <Input
            id={`${isEdit ? "edit" : "add"}-planUpdateIntervalInWeeks`}
            type="number"
            min="1"
            value={packageForm.planUpdateIntervalInWeeks}
            onChange={(e) =>
              setPackageForm((prev: PackageFormData) => ({
                ...prev,
                planUpdateIntervalInWeeks: e.target.value,
              }))
            }
            placeholder="e.g., 12"
          />
          <p className="text-xs text-gray-500 mt-1">
            How often plan updates occur (starting from start date)
          </p>
        </div>

        {/* Conditionally show renewal call field only for non-recurring packages */}
        {!packageForm.isRecurring && (
          <div>
            <Label
              htmlFor={`${isEdit ? "edit" : "add"}-renewalCallWeeksBeforeEnd`}
            >
              Renewal Call (weeks before end)
            </Label>
            <Input
              id={`${isEdit ? "edit" : "add"}-renewalCallWeeksBeforeEnd`}
              type="number"
              min="1"
              value={packageForm.renewalCallWeeksBeforeEnd}
              onChange={(e) =>
                setPackageForm((prev: PackageFormData) => ({
                  ...prev,
                  renewalCallWeeksBeforeEnd: e.target.value,
                }))
              }
              placeholder="2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-calculated for 2 weeks before the end of the package
            </p>
          </div>
        )}

        <ColorPicker
          selectedColor={packageForm.packageColor}
          onColorChange={(color) =>
            setPackageForm((prev: PackageFormData) => ({
              ...prev,
              packageColor: color,
            }))
          }
        />

        {/* Example Section - only show for non-recurring packages */}
        {exampleText && !packageForm.isRecurring && (
          <>
            <Separator />
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900">
                    Example Schedule
                  </h4>
                  <p className="text-sm text-blue-800">
                    A {packageForm.durationInWeeks} Week Package with progress
                    calls every {packageForm.progressIntervalInWeeks} weeks and
                    plan updates every {packageForm.planUpdateIntervalInWeeks}{" "}
                    weeks will generate:
                  </p>
                  <div className="space-y-1 text-sm text-blue-700">
                    {exampleText.progressCallWeeks.length > 0 && (
                      <p>
                        <strong>Progress calls at weeks:</strong>{" "}
                        {exampleText.progressCallWeeks.join(", ")}...
                      </p>
                    )}
                    {exampleText.planUpdateWeeks.length > 0 && (
                      <p>
                        <strong>Plan updates at weeks:</strong>{" "}
                        {exampleText.planUpdateWeeks.join(", ")}...
                      </p>
                    )}
                    <p>
                      <strong>Renewal call at week:</strong>{" "}
                      {exampleText.renewalCallWeek}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Show recurring package info */}
        {packageForm.isRecurring && (
          <>
            <Separator />
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-green-900">
                    Recurring Package
                  </h4>
                  <p className="text-sm text-green-800">
                    This recurring package will generate progress calls every{" "}
                    {packageForm.progressIntervalInWeeks} weeks and plan updates
                    every {packageForm.planUpdateIntervalInWeeks} weeks
                    indefinitely. No renewal calls will be scheduled as the
                    package automatically continues.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={isEdit ? updatePackage : createPackage}
            disabled={isEdit ? updatingPackage : creatingPackage}
          >
            {isEdit
              ? updatingPackage
                ? "Updating..."
                : "Update Package"
              : creatingPackage
              ? "Creating..."
              : "Create Package"}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
