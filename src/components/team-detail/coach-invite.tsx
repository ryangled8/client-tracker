"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface CoachInviteProps {
  teamId: string;
  buttonSize?: "sm" | "md" | "lg";
  buttonVariant?: "default" | "outline";
  onInviteSent: () => void;
}

export function CoachInvite({
  teamId,
  onInviteSent,
  buttonSize = "lg",
  buttonVariant = "outline",
}: CoachInviteProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    message: "",
  });

  const sendInvite = async () => {
    if (!inviteForm.email.trim()) {
      toast.error("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setInviting(true);
    try {
      const response = await fetch("/api/teams/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          email: inviteForm.email.trim(),
          message: inviteForm.message.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteForm({ email: "", message: "" });
        setDialogOpen(false);
        onInviteSent();
        toast.success("Invitation sent successfully");
      } else {
        toast.error(data.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Failed to send invitation");
    }
    setInviting(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <UserPlus className="h-4 w-4" />
          Invite Coach
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Coach to Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="inviteEmail">Email Address *</Label>
            <Input
              id="inviteEmail"
              type="email"
              value={inviteForm.email}
              onChange={(e) =>
                setInviteForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="coach@example.com"
            />
          </div>
          <div>
            <Label htmlFor="inviteMessage">Personal Message (Optional)</Label>
            <Textarea
              id="inviteMessage"
              value={inviteForm.message}
              onChange={(e) =>
                setInviteForm((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Hi! I'd like to invite you to join our coaching team..."
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>

            <Button onClick={sendInvite} disabled={inviting}>
              {inviting ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
