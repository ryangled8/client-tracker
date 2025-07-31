// Used in the CSV Upload Modal.
// training-packages.tsx uses it's own PackageModal component from the same file

"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AddPackageModalProps {
  teamId: string;
  onPackageCreated: () => void;
  onClose: () => void;
}

export const AddPackageModal: React.FC<AddPackageModalProps> = ({
  teamId,
  onPackageCreated,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    packageName: "",
    packageDuration: 12,
    planProgressCall: 4,
    planRenewalCall: 2,
    planUpdateWeek: 6,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/teams/add-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          ...formData,
        }),
      });

      if (response.ok) {
        toast.success("Package created successfully");
        onPackageCreated();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create package");
      }
    } catch (error) {
      console.error("Error creating package:", error);
      toast.error("Failed to create package");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Training Package</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="packageName">Package Name</Label>
            <Input
              id="packageName"
              value={formData.packageName}
              onChange={(e) =>
                setFormData({ ...formData, packageName: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="packageDuration">Duration (weeks)</Label>
            <Input
              id="packageDuration"
              type="number"
              min="1"
              value={formData.packageDuration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  packageDuration: Number.parseInt(e.target.value),
                })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="planProgressCall">
              Progress Call Interval (weeks)
            </Label>
            <Input
              id="planProgressCall"
              type="number"
              min="1"
              value={formData.planProgressCall}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  planProgressCall: Number.parseInt(e.target.value),
                })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="planRenewalCall">
              Renewal Call (weeks before end)
            </Label>
            <Input
              id="planRenewalCall"
              type="number"
              min="1"
              value={formData.planRenewalCall}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  planRenewalCall: Number.parseInt(e.target.value),
                })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="planUpdateWeek">Plan Update Interval (weeks)</Label>
            <Input
              id="planUpdateWeek"
              type="number"
              min="1"
              value={formData.planUpdateWeek}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  planUpdateWeek: Number.parseInt(e.target.value),
                })
              }
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Package"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
