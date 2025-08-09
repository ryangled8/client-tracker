"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Coach, TeamSettings } from "@/types";

interface Package {
  packageName: string;
  durationInWeeks: number;
  progressIntervalInWeeks: number;
  planUpdateIntervalInWeeks: number;
  renewalCallWeeksBeforeEnd: number;
  packageColor?: string;
  isActive: boolean;
  isRecurring: boolean;
}

interface Client {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  assignedCoach: {
    _id: string;
    name: string;
    email: string;
  };
  selectedPackage: string;
  startDate: string;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
  status: "active" | "inactive" | "paused";
  membershipType?: string;
  notes?: string;
  paymentDate?: string;
  customRenewalCallDate?: string;
  customProgressCallDate?: string;
  customPlanUpdateDate?: string;
}

interface EditClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  coaches: Coach[];
  packages: Package[];
  settings: TeamSettings;
  onClientUpdated: (updatedClient: Client) => void;
}

export function EditClientModal({
  client,
  isOpen,
  onClose,
  coaches,
  packages,
  settings,
  onClientUpdated,
}: EditClientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [notYetPaid, setNotYetPaid] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    assignedCoach: "",
    selectedPackage: "",
    startDate: "",
    paymentDate: "",
    currentWeight: "",
    targetWeight: "",
    height: "",
    status: "active" as "active" | "inactive" | "paused",
    membershipType: "",
    notes: "",
  });

  // Reset form when client changes
  useEffect(() => {
    if (client) {
      const hasPaymentDate =
        client.paymentDate && client.paymentDate.trim() !== "";
      setNotYetPaid(!hasPaymentDate);

      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        age: client.age?.toString() || "",
        gender: client.gender || "",
        assignedCoach: client.assignedCoach?._id || "",
        selectedPackage: client.selectedPackage || "",
        startDate: client.startDate
          ? new Date(client.startDate).toISOString().split("T")[0]
          : "",
        paymentDate: hasPaymentDate
          ? new Date(client.paymentDate!).toISOString().split("T")[0]
          : "",
        currentWeight: client.currentWeight?.toString() || "",
        targetWeight: client.targetWeight?.toString() || "",
        height: client.height?.toString() || "",
        status: client.status || "active",
        membershipType: client.membershipType || "",
        notes: client.notes || "",
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    if (!formData.assignedCoach) {
      toast.error("Please assign a coach");
      return;
    }

    if (!formData.selectedPackage) {
      toast.error("Please select a training package");
      return;
    }

    if (!formData.startDate) {
      toast.error("Start date is required");
      return;
    }

    setIsLoading(true);

    try {
      // Build the update object with only the fields that have values
      const updateData: any = {
        clientId: client._id,
        name: formData.name.trim(),
        assignedCoach: formData.assignedCoach,
        selectedPackage: formData.selectedPackage,
        startDate: formData.startDate,
        status: formData.status,
      };

      // Add optional fields only if they have values
      if (formData.email.trim()) updateData.email = formData.email.trim();
      if (formData.phone.trim()) updateData.phone = formData.phone.trim();
      if (formData.age && !isNaN(Number(formData.age)))
        updateData.age = Number(formData.age);
      if (formData.gender) updateData.gender = formData.gender;
      if (formData.currentWeight && !isNaN(Number(formData.currentWeight)))
        updateData.currentWeight = Number(formData.currentWeight);
      if (formData.targetWeight && !isNaN(Number(formData.targetWeight)))
        updateData.targetWeight = Number(formData.targetWeight);
      if (formData.height && !isNaN(Number(formData.height)))
        updateData.height = Number(formData.height);
      if (formData.membershipType.trim())
        updateData.membershipType = formData.membershipType.trim();
      if (formData.notes.trim()) updateData.notes = formData.notes.trim();

      // Only add payment date if not marked as "not yet paid" and has a value
      if (!notYetPaid && formData.paymentDate) {
        updateData.paymentDate = formData.paymentDate;
      } else if (notYetPaid) {
        // Explicitly clear payment date if marked as not yet paid
        updateData.paymentDate = null;
      }

      const response = await fetch("/api/clients/update-client", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        onClientUpdated(data.client);
        onClose();
      } else {
        toast.error(data.error || "Failed to update client");
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client: {client.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5 mt-4">
            {/* Name - Always required */}
            <div>
              <Label htmlFor="edit-name" className="gap-1">
                Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Client's full name"
                required
              />
            </div>

            {/* Assigned Coach - Required */}
            <div>
              <Label htmlFor="edit-assignedCoach" className="gap-1">
                Assigned Coach <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.assignedCoach}
                onValueChange={(value) =>
                  handleInputChange("assignedCoach", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select coach" />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.user._id} value={coach.user._id}>
                      {coach.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Training Package - Required */}
            <div>
              <Label htmlFor="edit-selectedPackage" className="gap-1">
                Training Package <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.selectedPackage}
                onValueChange={(value) =>
                  handleInputChange("selectedPackage", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages
                    .filter((pkg) => pkg.isActive)
                    .map((pkg, index) => (
                      <SelectItem
                        key={`edit-package-${pkg.packageName}-${index}`}
                        value={pkg.packageName}
                      >
                        {pkg.packageName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date - Required */}
            {settings.clientFormFields.startDate && (
              <div>
                <Label htmlFor="edit-startDate" className="gap-1">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  required
                />
              </div>
            )}

            {/* Status - Required */}
            {settings.clientFormFields.status && (
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Email - Optional */}
            {settings.clientFormFields.email && (
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="client@example.com"
                />
              </div>
            )}

            {/* Phone - Optional */}
            {settings.clientFormFields.phone && (
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            )}

            {/* Payment Date */}
            {settings.clientFormFields.paymentDate && (
              <div>
                <Label htmlFor="edit-paymentDate">Payment Date</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-notYetPaid"
                      checked={notYetPaid}
                      onCheckedChange={setNotYetPaid}
                    />
                    <Label htmlFor="edit-notYetPaid" className="text-sm">
                      Not yet paid
                    </Label>
                  </div>
                  {!notYetPaid && (
                    <Input
                      id="edit-paymentDate"
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) =>
                        handleInputChange("paymentDate", e.target.value)
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {/* Age - Optional */}
            {settings.clientFormFields.age && (
              <div>
                <Label htmlFor="edit-age">Age</Label>
                <Input
                  id="edit-age"
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder="25"
                />
              </div>
            )}

            {/* Gender - Optional */}
            {settings.clientFormFields.gender && (
              <div>
                <Label htmlFor="edit-gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-specified">Not specified</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Current Weight - Optional */}
            {settings.clientFormFields.currentWeight && (
              <div>
                <Label htmlFor="edit-currentWeight">Current Weight (kg)</Label>
                <Input
                  id="edit-currentWeight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.currentWeight}
                  onChange={(e) =>
                    handleInputChange("currentWeight", e.target.value)
                  }
                  placeholder="70.5"
                />
              </div>
            )}

            {/* Target Weight - Optional */}
            {settings.clientFormFields.targetWeight && (
              <div>
                <Label htmlFor="edit-targetWeight">Target Weight (kg)</Label>
                <Input
                  id="edit-targetWeight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.targetWeight}
                  onChange={(e) =>
                    handleInputChange("targetWeight", e.target.value)
                  }
                  placeholder="65.0"
                />
              </div>
            )}

            {/* Height - Optional */}
            {settings.clientFormFields.height && (
              <div>
                <Label htmlFor="edit-height">Height (cm)</Label>
                <Input
                  id="edit-height"
                  type="number"
                  min="0"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  placeholder="175"
                />
              </div>
            )}

            {/* Membership Type - Optional */}
            {settings.clientFormFields.membershipType && (
              <div>
                <Label htmlFor="edit-membershipType">Membership Type</Label>
                <Input
                  id="edit-membershipType"
                  value={formData.membershipType}
                  onChange={(e) =>
                    handleInputChange("membershipType", e.target.value)
                  }
                  placeholder="Premium, Basic, etc."
                />
              </div>
            )}
          </div>

          {/* Notes - Optional, full width */}
          {settings.clientFormFields.notes && (
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about the client..."
                rows={3}
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
