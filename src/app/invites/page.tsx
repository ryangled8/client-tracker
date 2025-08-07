"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Mail, Check, X, Clock } from "lucide-react";

interface TeamInvite {
  _id: string;
  team: {
    _id: string;
    name: string;
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

export default function InvitesPage() {
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<{
    id: string;
    action: "accept" | "decline";
  } | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/teams/invites/pending");
      const data = await response.json();
      if (response.ok) {
        console.log("📨 Fetched invites:", data.invites.length);
        setInvites(data.invites);
      } else {
        toast.error(data.error || "Failed to fetch invites");
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
      toast.error("Failed to fetch invites");
    } finally {
      setLoading(false);
    }
  };

  const respondToInvite = async (
    inviteId: string,
    action: "accept" | "decline"
  ) => {
    setResponding({ id: inviteId, action });
    try {
      const response = await fetch("/api/teams/invites/respond", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        await fetchInvites();
        window.dispatchEvent(new CustomEvent("invitesUpdated"));
      } else {
        toast.error(data.error || `Failed to ${action} invitation`);
      }
    } catch (error) {
      console.error(`Error ${action}ing invite:`, error);
      toast.error(`Failed to ${action} invitation`);
    }
    setResponding(null);
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
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

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-sm shadow-none">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h2 f-hr">Team Invitations</h1>
      </div>

      {invites.length === 0 ? (
        <div className="rounded-sm border p-10">
          <div className="text-center">
            <Mail className="size-5 mx-auto text-blk-60 mb-4" />
            <h3 className="text-lg text-blk mb-1">No pending invitations</h3>

            <p className="text-blk-60">
              You do not have any pending team invitations at the moment.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {invites.map((invite, idx) => {
            const expired = isExpired(invite.expiresAt);
            return (
              <div key={idx} className="rounded-sm border p-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h1 className="text-lg mb-1">
                      Invitation to join {invite.team.name}
                    </h1>
                    <div className="flex items-center space-x-2">
                      <Badge variant={expired ? "secondary" : "default"}>
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeLeft(invite.expiresAt)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-blk">
                        <span className="f-hm">{invite.inviter.name}</span> (
                        {invite.inviter.email}) has invited you to join their
                        coaching team.
                      </p>
                      {invite.message && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-sm border-l-3">
                          <p className="text-sm italic">{invite.message}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-blk-60">
                      Invited {new Date(invite.createdAt).toLocaleDateString()}
                    </div>
                    {!expired && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => respondToInvite(invite._id, "accept")}
                          disabled={
                            responding?.id === invite._id &&
                            responding?.action === "accept"
                          }
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {responding?.id === invite._id &&
                          responding?.action === "accept"
                            ? "Accepting..."
                            : "Accept"}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => respondToInvite(invite._id, "decline")}
                          disabled={
                            responding?.id === invite._id &&
                            responding?.action === "decline"
                          }
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          {responding?.id === invite._id &&
                          responding?.action === "decline"
                            ? "Declining..."
                            : "Decline"}
                        </Button>
                      </div>
                    )}
                    {expired && (
                      <Badge variant="secondary" className="w-fit">
                        This invitation has expired
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
