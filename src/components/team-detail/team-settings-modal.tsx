"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TeamSettings {
  clientFormFields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    age: boolean;
    gender: boolean;
    assignedCoach: boolean;
    trainingPlan: boolean;
    renewalCallDate: boolean;
    progressCallDate: boolean;
    planUpdateDate: boolean;
    currentWeight: boolean;
    targetWeight: boolean;
    height: boolean;
    status: boolean;
    membershipType: boolean;
    startDate: boolean;
    notes: boolean;
  };
  noticePeriodWeeks: number;
  dateFormat: "dd/mm/yyyy" | "mm/dd/yyyy";
}

interface Team {
  _id: string;
  name: string;
  settings: TeamSettings;
}

interface TeamSettingsModalProps {
  team: Team;
  onSettingsUpdated: () => void;
}

const fieldLabels = {
  name: "Client Name*",
  email: "Email",
  phone: "Phone",
  age: "Age",
  gender: "Gender",
  startDate: "Start Date",
  assignedCoach: "Assigned Coach*",
  trainingPlan: "Training Plan*",
  renewalCallDate: "Next Renewal Call Date",
  progressCallDate: "Next Progress Call Date",
  planUpdateDate: "Next Plan Update Date",
  currentWeight: "Current Weight",
  targetWeight: "Target Weight",
  height: "Height",
  membershipType: "Membership Type",
  status: "Status",
  notes: "Notes",
};

const fieldDescriptions = {
  renewalCallDate: "Auto-calculated from training plan",
  progressCallDate: "Auto-calculated from training plan",
  planUpdateDate: "Auto-calculated from training plan",
};

const requiredFields = ["name", "assignedCoach", "trainingPlan"];

export function TeamSettingsModal({
  team,
  onSettingsUpdated,
}: TeamSettingsModalProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [teamName, setTeamName] = useState(team.name);
  const [settings, setSettings] = useState<TeamSettings>(team.settings);

  const handleFieldToggle = (
    field: keyof TeamSettings["clientFormFields"],
    enabled: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      clientFormFields: {
        ...prev.clientFormFields,
        [field]: enabled,
      },
    }));
  };

  const handleNoticePeriodChange = (weeks: string) => {
    const weeksNum = Number.parseInt(weeks);
    if (weeksNum >= 1 && weeksNum <= 12) {
      setSettings((prev) => ({
        ...prev,
        noticePeriodWeeks: weeksNum,
      }));
    }
  };

  const handleDateFormatChange = (format: "dd/mm/yyyy" | "mm/dd/yyyy") => {
    setSettings((prev) => ({
      ...prev,
      dateFormat: format,
    }));
  };

  const saveSettings = async () => {
    if (!teamName.trim()) {
      toast.error("Team name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/teams/update-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team._id,
          name: teamName,
          settings,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDialogOpen(false);
        onSettingsUpdated();
        toast.success("Team settings updated successfully");
      } else {
        toast.error(data.error || "Failed to update team settings");
      }
    } catch (error) {
      console.error("Error updating team settings:", error);
      toast.error("Failed to update team settings");
    }
    setSaving(false);
  };

  const deleteTeam = async () => {
    if (deleteConfirmation !== team.name) {
      toast.error("Team name confirmation doesn't match");
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/teams/delete-team?id=${team._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Team deleted successfully");
        router.push("/teams");
      } else {
        toast.error(data.error || "Failed to delete team");
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Failed to delete team");
    }
    setDeleting(false);
  };

  const resetForm = () => {
    setTeamName(team.name);
    setSettings(team.settings);
    setDeleteConfirmation("");
  };

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Team Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          {/* General Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">General</h3>
            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
          </div>

          <Separator />

          {/* Client Form Fields */}
          <div>
            <h3 className="text-lg font-medium mb-2">Client Form Fields</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select which fields should appear in the add client form and
              client table.
            </p>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(fieldLabels).map(([field, label]) => {
                const isRequired = requiredFields.includes(field);
                const isEnabled =
                  settings.clientFormFields[
                    field as keyof TeamSettings["clientFormFields"]
                  ];
                const hasDescription = field in fieldDescriptions;

                return (
                  <div key={field} className="flex items-start space-x-2">
                    <Switch
                      id={field}
                      checked={isEnabled}
                      onCheckedChange={(checked) =>
                        handleFieldToggle(
                          field as keyof TeamSettings["clientFormFields"],
                          checked
                        )
                      }
                      disabled={isRequired}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={field}
                        className={`text-sm ${isRequired ? "font-medium" : ""}`}
                      >
                        {label}
                      </Label>
                      {hasDescription && (
                        <p className="text-xs text-gray-500 mt-1">
                          {
                            fieldDescriptions[
                              field as keyof typeof fieldDescriptions
                            ]
                          }
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="noticePeriod">Notice Period (weeks)</Label>
                <Select
                  value={settings.noticePeriodWeeks.toString()}
                  onValueChange={handleNoticePeriodChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (
                      <SelectItem key={week} value={week.toString()}>
                        {week} week{week > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Highlight clients with dates due within this period
                </p>
              </div>

              <div>
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  value={settings.dateFormat}
                  onValueChange={handleDateFormatChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div>
            <h3 className="text-lg font-medium mb-2 text-red-600">
              Danger Zone
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete this team and all associated data. This action
              cannot be undone.
            </p>
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-900">Delete Team</h4>
                  <p className="text-sm text-red-700">
                    This will permanently delete the team, all clients, and
                    associated data.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Team
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <span>
                          This action cannot be undone. This will permanently
                          delete the team <strong>{team.name}</strong> and
                          remove all associated data including:
                        </span>
                        <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                          <li>All team clients and their progress data</li>
                          <li>All training plans</li>
                          <li>All team invitations</li>
                          <li>All team settings</li>
                        </ul>
                        <div className="mt-4">
                          <Label
                            htmlFor="deleteConfirmation"
                            className="text-sm font-medium"
                          >
                            Type the team name<strong>{team.name}</strong>to
                            confirm:
                          </Label>
                          <Input
                            id="deleteConfirmation"
                            value={deleteConfirmation}
                            onChange={(e) =>
                              setDeleteConfirmation(e.target.value)
                            }
                            placeholder={team.name}
                            className="mt-2"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setDeleteConfirmation("")}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteTeam}
                        disabled={deleteConfirmation !== team.name || deleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleting ? "Deleting..." : "Delete Team"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
