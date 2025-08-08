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

import { toast } from "sonner";
import { Settings, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeamSettings {
  clientFormFields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    age: boolean;
    gender: boolean;
    assignedCoach: boolean;
    trainingPackage: boolean;
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
    paymentDate: boolean;
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
  startDate: "Start Date*",
  assignedCoach: "Assigned Coach*",
  trainingPackage: "Training Package*",
  paymentDate: "Payment Date",
  email: "Email",
  phone: "Phone",
  age: "Age",
  gender: "Gender",
  membershipType: "Membership Type",
  status: "Status",
  renewalCallDate: "Next Renewal Call Date",
  progressCallDate: "Next Progress Call Date",
  planUpdateDate: "Next Plan Update Date",
  currentWeight: "Current Weight",
  targetWeight: "Target Weight",
  height: "Height",
  notes: "Notes",
};

const requiredFields = [
  "name",
  "assignedCoach",
  "trainingPackage",
  "startDate",
];

const fieldDescriptions = {
  name: "First and last name of the client",
  startDate: "The date the client started",
  email: "Client email address",
  paymentDate: "The date the client made payment",
  phone: "Client phone number",
  age: "Client age",
  gender: "Client gender",
  assignedCoach: "The coach assigned to the client",
  trainingPackage: "Client training package",
  renewalCallDate: "The date for the next renewal call with the client",
  progressCallDate: "The date for the next progress call with the client",
  planUpdateDate: "The date for the next training plan update with the client",
  currentWeight: "Client current weight",
  targetWeight: "Client target weight",
  height: "Client height",
  membershipType: "Membership type of client",
  status: "Client is active / inactive / paused",
  notes: "Additional client notes",
};

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
  const [activeTab, setActiveTab] = useState("general");

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
        <Button variant="outline" size="lg">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val)}
          defaultValue="general"
        >
          <TabsList className="grid w-full grid-cols-3 rounded-sm mb-4">
            <TabsTrigger className="rounded-xs cursor-pointer" value="general">
              General
            </TabsTrigger>
            <TabsTrigger
              className="rounded-xs cursor-pointer"
              value="formFields"
            >
              Client Form Fields
            </TabsTrigger>
            <TabsTrigger className="rounded-xs cursor-pointer" value="settings">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <>
              <p className="text-sm text-blk-60 border-l-4 border-l-blue-600 p-2 mb-6">
                Update team name, notice period and date format.
              </p>

              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>

              <div className="flex gap-6 items-start mt-6">
                <div className="w-1/2">
                  <Label htmlFor="noticePeriod">Notice Period (weeks)</Label>

                  <p className="text-xs text-gray-500 -mt-0.5 mb-2">
                    Highlight clients with dates due within this period.
                  </p>

                  <Select
                    value={settings.noticePeriodWeeks.toString()}
                    onValueChange={handleNoticePeriodChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        (week) => (
                          <SelectItem key={week} value={week.toString()}>
                            {week} week{week > 1 ? "s" : ""}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-1/2">
                  <Label htmlFor="dateFormat">Date Format</Label>

                  <p className="text-xs text-gray-500 -mt-0.5 mb-2">
                    Select preferred date format.
                  </p>

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
            </>
          </TabsContent>

          {/* Client Form Fields Tab */}
          <TabsContent value="formFields">
            <>
              <p className="text-sm text-blk-60 border-l-4 border-l-blue-600 p-2 mb-6">
                Select which fields you want to track for clients.
              </p>

              <div className="grid grid-cols-3 gap-2">
                <Link
                  href="/bolt-ons/custom-field"
                  target="_blank"
                  className="
                    col-span-1 text-blue-600 flex flex-col justify-between items-start bg-blue-50 border border-blue-200 rounded-sm transition-all duration-300 ease-in p-2
                    cursor-pointer hover:bg-gray-50
                  "
                >
                  <div>
                    <p className="text-sm">Add Custom Field</p>
                    <p className="text-xs text-blk-60 mt-0.5">
                      Collect additional client info
                    </p>
                  </div>
                  <div className="text-blue-600 text-xs cursor-pointer flex items-center gap-0.5">
                    <Sparkles className="size-3.5" />
                    Add Bolt On
                  </div>
                </Link>

                {Object.entries(fieldLabels).map(([field, label]) => {
                  const isRequired = requiredFields.includes(field);
                  const isEnabled =
                    settings.clientFormFields[
                      field as keyof TeamSettings["clientFormFields"]
                    ];
                  const hasDescription = field in fieldDescriptions;

                  return (
                    <div
                      key={field}
                      className={`col-span-1 flex flex-col justify-between items-start border rounded-sm transition-all duration-300 ease-in p-2 ${
                        isEnabled ? "bg-gray-50" : ""
                      }`}
                    >
                      <div>
                        <Label htmlFor={field} className="text-sm">
                          {label}
                        </Label>
                        {hasDescription && (
                          <p className="text-xs text-blk-60 -mt-1">
                            {
                              fieldDescriptions[
                                field as keyof typeof fieldDescriptions
                              ]
                            }
                          </p>
                        )}
                      </div>

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
                        className="mt-2"
                      />
                    </div>
                  );
                })}
              </div>
            </>
          </TabsContent>

          {/* Settings / Danger Zone Tab */}
          <TabsContent value="settings">
            <>
              <p className="text-sm text-blk-60 border-l-4 border-l-red-600 p-2 mb-6">
                Permanently delete this team and all associated data.
              </p>

              <div className="border border-red-200 rounded-sm p-4 bg-red-50">
                <p className="text-xs text-red-700">
                  <span className="text-sm f-hm block mb-0.5">
                    This action cannot be undone.
                  </span>
                  Type the team name <strong>"{team.name}"</strong> to confirm
                  deletion.
                </p>

                <div className="flex gap-2 items-center mt-4">
                  <Input
                    id="deleteConfirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type team name to confirm"
                  />

                  <Button
                    size="md"
                    variant="destructive"
                    onClick={deleteTeam}
                    disabled={deleteConfirmation !== team.name || deleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? "Deleting..." : "Delete Team"}
                  </Button>
                </div>
              </div>
            </>
          </TabsContent>
        </Tabs>

        {/* Footer Buttons */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            className="transition-none"
            size="md"
            variant="outline"
            onClick={() => setDialogOpen(false)}
          >
            Close
          </Button>

          {activeTab !== "settings" && (
            <Button
              className="transition-none"
              size="md"
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
