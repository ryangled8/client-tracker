"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { TeamSettings } from "@/types";

interface Coach {
  _id: string;
  name: string;
  email: string;
}

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

interface AddClientModalProps {
  teamId: string;
  coaches: Coach[];
  packages: Package[];
  settings: TeamSettings;
  onClientAdded: () => void;
}

export function AddClientModal({
  teamId,
  coaches,
  packages,
  settings,
  onClientAdded,
}: AddClientModalProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notYetPaid, setNotYetPaid] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    paymentDate: new Date(),
    age: "",
    gender: "",
    assignedCoach: "",
    selectedPackage: "",
    startDate: new Date(),
    currentWeight: "",
    targetWeight: "",
    height: "",
    status: "active",
    membershipType: "",
    notes: "",
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!dialogOpen) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        paymentDate: new Date(),
        age: "",
        gender: "",
        assignedCoach: coaches.length > 0 ? coaches[0]._id : "",
        selectedPackage:
          packages.filter((p) => p.isActive).length > 0
            ? packages.filter((p) => p.isActive)[0].packageName
            : "",
        startDate: new Date(),
        currentWeight: "",
        targetWeight: "",
        height: "",
        status: "active",
        membershipType: "",
        notes: "",
      });
      setNotYetPaid(false);
    }
  }, [dialogOpen, coaches, packages]);

  const handleInputChange = (field: string, value: string | Date) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Client name is required");
      return false;
    }

    if (!formData.assignedCoach) {
      toast.error("Assigned coach is required");
      return false;
    }

    if (!formData.selectedPackage) {
      toast.error("Training package is required");
      return false;
    }

    // Only validate email format if it has a value (it's optional)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return false;
      }
    }

    // Only validate age if it has a value (it's optional)
    if (formData.age && formData.age.trim()) {
      const age = Number.parseInt(formData.age);
      if (isNaN(age) || age < 1 || age > 120) {
        toast.error("Age must be between 1 and 120");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Build client data - only include fields that have values
      const clientData: any = {
        name: formData.name.trim(),
        team: teamId,
        assignedCoach: formData.assignedCoach,
        selectedPackage: formData.selectedPackage,
        startDate: formData.startDate,
        status: formData.status,
      };

      // Only add optional fields if they have values - same as other optional fields
      if (formData.email && formData.email.trim()) {
        clientData.email = formData.email.trim();
      }
      if (formData.phone && formData.phone.trim()) {
        clientData.phone = formData.phone.trim();
      }
      if (formData.age && formData.age.trim()) {
        clientData.age = Number.parseInt(formData.age);
      }
      if (formData.gender && formData.gender.trim()) {
        clientData.gender = formData.gender;
      }
      if (formData.currentWeight && formData.currentWeight.trim()) {
        clientData.currentWeight = Number.parseFloat(formData.currentWeight);
      }
      if (formData.targetWeight && formData.targetWeight.trim()) {
        clientData.targetWeight = Number.parseFloat(formData.targetWeight);
      }
      if (formData.height && formData.height.trim()) {
        clientData.height = Number.parseFloat(formData.height);
      }
      if (formData.membershipType && formData.membershipType.trim()) {
        clientData.membershipType = formData.membershipType.trim();
      }
      if (formData.notes && formData.notes.trim()) {
        clientData.notes = formData.notes.trim();
      }

      // Only add payment date if not marked as "not yet paid"
      if (!notYetPaid && formData.paymentDate instanceof Date) {
        clientData.paymentDate = formData.paymentDate;
      }

      const response = await fetch("/api/clients/add-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });

      const data = await response.json();

      if (response.ok) {
        setDialogOpen(false);
        onClientAdded();
        toast.success(`Client ${formData.name} added successfully`);
      } else {
        toast.error(data.error || "Failed to add client");
      }
    } catch (error) {
      console.error("Error adding client:", error);
      toast.error("Failed to add client");
    }
    setSaving(false);
  };

  const activePackages = packages.filter((pkg) => pkg.isActive);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name - Always required */}
            <div>
              <Label htmlFor="name" className="font-medium">
                Client Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter client name"
              />
            </div>

            {/* Email - Optional */}
            {settings.clientFormFields.email && (
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="client@example.com"
                />
              </div>
            )}

            {/* Phone */}
            {settings.clientFormFields.phone && (
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            )}

            {/* Payment Date */}
            {settings.clientFormFields.paymentDate && (
              <div>
                <Label htmlFor="paymentDate">Payment Date</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notYetPaid"
                      checked={notYetPaid}
                      onCheckedChange={setNotYetPaid}
                    />
                    <Label htmlFor="notYetPaid" className="text-sm">
                      Not yet paid
                    </Label>
                  </div>
                  {!notYetPaid && (
                    <Input
                      id="paymentDate"
                      type="date"
                      value={
                        formData.paymentDate instanceof Date
                          ? formData.paymentDate.toISOString().split("T")[0]
                          : formData.paymentDate
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "paymentDate",
                          new Date(e.target.value)
                        )
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {/* Age */}
            {settings.clientFormFields.age && (
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder="Age"
                />
              </div>
            )}

            {/* Gender */}
            {settings.clientFormFields.gender && (
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
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

            {/* Assigned Coach - Always required */}
            <div>
              <Label htmlFor="assignedCoach" className="font-medium">
                Assigned Coach *
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
                  {coaches.map((coach, index) => (
                    <SelectItem
                      key={`add-coach-${coach._id}-${index}`}
                      value={coach._id}
                    >
                      {coach.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Training Package - Always required */}
            <div>
              <Label htmlFor="selectedPackage" className="font-medium">
                Training Package *
              </Label>
              <Select
                value={formData.selectedPackage}
                onValueChange={(value) =>
                  handleInputChange("selectedPackage", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  {activePackages.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      No active packages available
                    </div>
                  ) : (
                    activePackages.map((pkg, index) => (
                      <SelectItem
                        key={`add-package-${pkg.packageName}-${index}`}
                        value={pkg.packageName}
                      >
                        {pkg.packageName} ({pkg.durationInWeeks} weeks)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {activePackages.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  Please create a training package first
                </p>
              )}
            </div>

            {/* Start Date - Always required */}
            <div>
              <Label htmlFor="startDate" className="font-medium">
                Start Date *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={
                  formData.startDate instanceof Date
                    ? formData.startDate.toISOString().split("T")[0]
                    : formData.startDate
                }
                onChange={(e) =>
                  handleInputChange("startDate", new Date(e.target.value))
                }
              />
            </div>

            {/* Current Weight */}
            {settings.clientFormFields.currentWeight && (
              <div>
                <Label htmlFor="currentWeight">Current Weight (kg)</Label>
                <Input
                  id="currentWeight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.currentWeight}
                  onChange={(e) =>
                    handleInputChange("currentWeight", e.target.value)
                  }
                  placeholder="Current weight"
                />
              </div>
            )}

            {/* Target Weight */}
            {settings.clientFormFields.targetWeight && (
              <div>
                <Label htmlFor="targetWeight">Target Weight (kg)</Label>
                <Input
                  id="targetWeight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.targetWeight}
                  onChange={(e) =>
                    handleInputChange("targetWeight", e.target.value)
                  }
                  placeholder="Target weight"
                />
              </div>
            )}

            {/* Height */}
            {settings.clientFormFields.height && (
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  placeholder="Height"
                />
              </div>
            )}

            {/* Status */}
            {settings.clientFormFields.status && (
              <div>
                <Label htmlFor="status">Status</Label>
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

            {/* Membership Type */}
            {settings.clientFormFields.membershipType && (
              <div>
                <Label htmlFor="membershipType">Membership Type</Label>
                <Input
                  id="membershipType"
                  value={formData.membershipType}
                  onChange={(e) =>
                    handleInputChange("membershipType", e.target.value)
                  }
                  placeholder="e.g., Premium, Standard"
                />
              </div>
            )}
          </div>

          {/* Notes - Full width */}
          {settings.clientFormFields.notes && (
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about the client"
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Adding..." : "Add Client"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
