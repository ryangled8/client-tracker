"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Clock, X, Mail } from "lucide-react";
import { CoachInvite } from "./coach-invite";

interface PendingInvite {
  _id: string;
  inviteeEmail: string;
  invitee?: {
    _id: string;
    name: string;
    email: string;
  };
  inviter: {
    _id: string;
    name: string;
    email: string;
  };
  message: string;
  createdAt: string;
  expiresAt: string;
}

interface PendingInvitesProps {
  teamId: string;
  isOwner: boolean;
  open: boolean;
  onDataUpdated: () => void;
  onOpenChange: (open: boolean) => void;
  onInvitesCancelled?: () => void;
}

export function PendingInvites({
  teamId,
  isOwner,
  open,
  onDataUpdated,
  onOpenChange,
  onInvitesCancelled,
}: PendingInvitesProps) {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (open && isOwner) {
      fetchPendingInvites();
    }
  }, [open, teamId, isOwner]);

  const fetchPendingInvites = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/teams/invites/pending?teamId=${teamId}`
      );
      const data = await response.json();
      if (response.ok) {
        setInvites(data.invites);
      } else {
        toast.error(data.error || "Failed to fetch pending invites");
      }
    } catch (error) {
      console.error("Error fetching pending invites:", error);
      toast.error("Failed to fetch pending invites");
    } finally {
      setLoading(false);
    }
  };

  const cancelInvite = async (inviteId: string, email: string) => {
    setCancelling(inviteId);
    try {
      const response = await fetch(`/api/teams/invites/cancel?id=${inviteId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Invitation to ${email} has been cancelled`);
        await fetchPendingInvites(); // Refresh the list
        onInvitesCancelled?.(); // Notify parent component

        // Trigger sidebar refresh
        window.dispatchEvent(new CustomEvent("invitesUpdated"));
      } else {
        toast.error(data.error || "Failed to cancel invitation");
      }
    } catch (error) {
      console.error("Error cancelling invite:", error);
      toast.error("Failed to cancel invitation");
    }
    setCancelling(null);
  };

  const formatTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "Expires today";
    return `Expires in ${diffDays} days`;
  };

  if (!isOwner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-sm p-4 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 h4">
            <Mail className="size-4.5" />
            Pending Invites
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 1 }).map((_, i) => (
              <div key={i} className="border rounded-sm p-4">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32 mb-2" />
                <Skeleton className="h-3 w-64" />
              </div>
            ))}
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-8 text-blk-60">
            <Mail className="size-4 mx-auto mb-4" />
            <p>No pending invites</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite._id}
                className="border rounded-sm p-4 bg-gray-50"
              >
                <div className="flex items-start justify-between relative">
                  <div className="absolute -top-2 -right-2 flex items-center gap-1">
                    <div className="text-xs bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeLeft(invite.expiresAt)}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        cancelInvite(invite._id, invite.inviteeEmail)
                      }
                      disabled={cancelling === invite._id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {cancelling === invite._id ? (
                        "Cancelling..."
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          <span className="sr-only">Cancel invitation</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div>
                    <div className="text-blk">{invite.inviteeEmail}</div>

                    <div className="text-sm text-gray-600 mb-2">
                      Invited by {invite.inviter.name} on{" "}
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </div>

                    {invite.message && (
                      <div className="text-sm text-gray-600 italic pl-3 border-l-2 border-gray-300">
                        {invite.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t gap-2">
          {/* Invite coach CTA */}
          <CoachInvite
            buttonSize="md"
            buttonVariant="default"
            teamId={teamId}
            onInviteSent={onDataUpdated}
          />

          <Button
            variant="outline"
            size="md"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
