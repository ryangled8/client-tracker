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

interface Package {
  packageName: string;
  packageDuration: number;
  planProgressCall: number;
  planRenewalCall: number;
  planUpdateWeek: number;
  packageColor?: string;
  isActive: boolean;
  createdAt: string;
}

interface PackageFormData {
  packageName: string;
  packageDuration: string;
  planProgressCall: string;
  planRenewalCall: string;
  planUpdateWeek: string;
  packageColor: string;
}

interface TrainingPackagesProps {
  packages: Package[];
  teamId: string;
  onPackagesUpdated: () => void;
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

export function TrainingPackages({
  packages,
  teamId,
  onPackagesUpdated,
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
    packageDuration: "",
    planProgressCall: "",
    planRenewalCall: "",
    planUpdateWeek: "",
    packageColor: "#3b82f6",
  });

  const resetPackageForm = () => {
    setPackageForm({
      packageName: "",
      packageDuration: "",
      planProgressCall: "",
      planRenewalCall: "",
      planUpdateWeek: "",
      packageColor: "#3b82f6",
    });
  };

  const validatePackageForm = (
    packageName: string,
    duration: number,
    progressCall: number,
    renewalCall: number,
    updateWeek: number,
    isEdit = false,
    originalPackageName = ""
  ) => {
    if (!packageName.trim()) {
      toast.error("Package name is required");
      return false;
    }

    if (!duration || duration < 1) {
      toast.error("Package duration must be at least 1 week");
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
      toast.error(
        `Training plan update week must be between 1 and ${duration}`
      );
      return false;
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
      packageDuration,
      planProgressCall,
      planRenewalCall,
      planUpdateWeek,
      packageColor,
    } = packageForm;
    const duration = Number.parseInt(packageDuration);
    const progressCall = Number.parseInt(planProgressCall);
    const renewalCall = Number.parseInt(planRenewalCall);
    const updateWeek = Number.parseInt(planUpdateWeek);

    if (
      !validatePackageForm(
        packageName,
        duration,
        progressCall,
        renewalCall,
        updateWeek
      )
    ) {
      return;
    }

    setCreatingPackage(true);
    try {
      const newPackage = {
        packageName: packageName.trim(),
        packageDuration: duration,
        planProgressCall: progressCall,
        planRenewalCall: renewalCall,
        planUpdateWeek: updateWeek,
        packageColor: packageColor,
        isActive: true,
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
        onPackagesUpdated(); // This will trigger a refresh of the entire team data
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
      packageDuration: pkg.packageDuration.toString(),
      planProgressCall: pkg.planProgressCall.toString(),
      planRenewalCall: pkg.planRenewalCall.toString(),
      planUpdateWeek: pkg.planUpdateWeek.toString(),
      packageColor: pkg.packageColor || "#3b82f6",
    });
    setEditingPackageIndex(packageIndex);
    setEditPackageDialogOpen(true);
  };

  const updatePackage = async () => {
    if (editingPackageIndex === null) return;

    const {
      packageName,
      packageDuration,
      planProgressCall,
      planRenewalCall,
      planUpdateWeek,
      packageColor,
    } = packageForm;
    const duration = Number.parseInt(packageDuration);
    const progressCall = Number.parseInt(planProgressCall);
    const renewalCall = Number.parseInt(planRenewalCall);
    const updateWeek = Number.parseInt(planUpdateWeek);

    const originalPackage = packages[editingPackageIndex];
    if (
      !validatePackageForm(
        packageName,
        duration,
        progressCall,
        renewalCall,
        updateWeek,
        true,
        originalPackage.packageName
      )
    ) {
      return;
    }

    setUpdatingPackage(true);
    try {
      const updatedPackages = [...packages];
      updatedPackages[editingPackageIndex] = {
        ...originalPackage,
        packageName: packageName.trim(),
        packageDuration: duration,
        planProgressCall: progressCall,
        planRenewalCall: renewalCall,
        planUpdateWeek: updateWeek,
        packageColor: packageColor || originalPackage.packageColor || "#3b82f6", // Ensure color is preserved
      };

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
        setEditPackageDialogOpen(false);
        setEditingPackageIndex(null);
        onPackagesUpdated(); // This will trigger a refresh of the entire team data
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
        onPackagesUpdated(); // This will trigger a refresh of the entire team data
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
        onPackagesUpdated(); // This will trigger a refresh of the entire team data
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Training Packages
          </CardTitle>
          <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Package
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Training Package</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="add-packageName">Package Name *</Label>
                  <Input
                    id="add-packageName"
                    value={packageForm.packageName}
                    onChange={(e) =>
                      setPackageForm((prev) => ({
                        ...prev,
                        packageName: e.target.value,
                      }))
                    }
                    placeholder="e.g., 12 Week Transformation Package"
                  />
                </div>
                <div>
                  <Label htmlFor="add-packageDuration">
                    Package Duration (weeks) *
                  </Label>
                  <Input
                    id="add-packageDuration"
                    type="number"
                    min="1"
                    value={packageForm.packageDuration}
                    onChange={(e) =>
                      setPackageForm((prev) => ({
                        ...prev,
                        packageDuration: e.target.value,
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
                    value={packageForm.planProgressCall}
                    onChange={(e) =>
                      setPackageForm((prev) => ({
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
                    value={packageForm.planRenewalCall}
                    onChange={(e) =>
                      setPackageForm((prev) => ({
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
                  <Label htmlFor="add-planUpdateWeek">
                    Training Plan Update Week *
                  </Label>
                  <Input
                    id="add-planUpdateWeek"
                    type="number"
                    min="1"
                    value={packageForm.planUpdateWeek}
                    onChange={(e) =>
                      setPackageForm((prev) => ({
                        ...prev,
                        planUpdateWeek: e.target.value,
                      }))
                    }
                    placeholder="e.g., 6"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Which week should the training plan be updated?
                  </p>
                </div>
                <ColorPicker
                  selectedColor={packageForm.packageColor}
                  onColorChange={(color) =>
                    setPackageForm((prev) => ({ ...prev, packageColor: color }))
                  }
                />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPackageDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createPackage} disabled={creatingPackage}>
                    {creatingPackage ? "Creating..." : "Create Package"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {packages.length === 0 ? (
            <p className="text-sm text-gray-500">No packages created</p>
          ) : (
            packages.map((pkg, index) => (
              <div
                key={`package-${pkg.packageName}-${index}`}
                className="text-sm border rounded p-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        style={{
                          backgroundColor: pkg.packageColor || "#3b82f6",
                          color: "white",
                          border: "none",
                        }}
                      >
                        {pkg.packageName}
                      </Badge>
                      <Badge variant={pkg.isActive ? "default" : "secondary"}>
                        {pkg.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {pkg.packageDuration} weeks • Progress: Week{" "}
                      {pkg.planProgressCall} • Renewal: Week{" "}
                      {pkg.planRenewalCall} • Plan Update: Week{" "}
                      {pkg.planUpdateWeek}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => editPackage(index)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Package
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => togglePackageStatus(index)}
                      >
                        {pkg.isActive ? (
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
                        onClick={() => deletePackage(index)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Package
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Edit Package Dialog */}
      <Dialog
        open={editPackageDialogOpen}
        onOpenChange={setEditPackageDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Training Package</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-packageName">Package Name *</Label>
              <Input
                id="edit-packageName"
                value={packageForm.packageName}
                onChange={(e) =>
                  setPackageForm((prev) => ({
                    ...prev,
                    packageName: e.target.value,
                  }))
                }
                placeholder="e.g., 12 Week Transformation Package"
              />
            </div>
            <div>
              <Label htmlFor="edit-packageDuration">
                Package Duration (weeks) *
              </Label>
              <Input
                id="edit-packageDuration"
                type="number"
                min="1"
                value={packageForm.packageDuration}
                onChange={(e) =>
                  setPackageForm((prev) => ({
                    ...prev,
                    packageDuration: e.target.value,
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
                value={packageForm.planProgressCall}
                onChange={(e) =>
                  setPackageForm((prev) => ({
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
                value={packageForm.planRenewalCall}
                onChange={(e) =>
                  setPackageForm((prev) => ({
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
              <Label htmlFor="edit-planUpdateWeek">
                Training Plan Update Week *
              </Label>
              <Input
                id="edit-planUpdateWeek"
                type="number"
                min="1"
                value={packageForm.planUpdateWeek}
                onChange={(e) =>
                  setPackageForm((prev) => ({
                    ...prev,
                    planUpdateWeek: e.target.value,
                  }))
                }
                placeholder="e.g., 6"
              />
              <p className="text-xs text-gray-500 mt-1">
                Which week should the training plan be updated?
              </p>
            </div>
            <ColorPicker
              selectedColor={packageForm.packageColor}
              onColorChange={(color) =>
                setPackageForm((prev) => ({ ...prev, packageColor: color }))
              }
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditPackageDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={updatePackage} disabled={updatingPackage}>
                {updatingPackage ? "Updating..." : "Update Package"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
