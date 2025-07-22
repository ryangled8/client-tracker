"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Mail, Clock, X } from "lucide-react";

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
  onInvitesCancelled?: () => void;
}

export function PendingInvites({
  teamId,
  isOwner,
  onInvitesCancelled,
}: PendingInvitesProps) {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (isOwner) {
      fetchPendingInvites();
    }
  }, [teamId, isOwner]);

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
    return `${diffDays} days left`;
  };

  if (!isOwner) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (invites.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          Pending Invitations ({invites.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite._id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{invite.inviteeEmail}</div>
                <div className="text-xs text-gray-500">
                  Invited by {invite.inviter.name} •{" "}
                  {new Date(invite.createdAt).toLocaleDateString()}
                </div>
                {invite.message && (
                  <div className="text-xs text-gray-600 mt-1 italic">
                    {invite.message}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeLeft(invite.expiresAt)}
                </Badge>
                {invite.invitee ? (
                  <Badge variant="secondary">Registered</Badge>
                ) : (
                  <Badge variant="outline">Pending signup</Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelInvite(invite._id, invite.inviteeEmail)}
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
