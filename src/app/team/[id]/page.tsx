"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamActions } from "@/components/team-detail/team-actions";
import { TeamClientsList } from "@/components/team-detail/team-clients-list";
import { toast } from "sonner";
import { ArrowLeft, Settings, Plus } from "lucide-react";
import Link from "next/link";

interface Team {
  _id: string;
  name: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  coaches: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  plans: Array<{
    planName: string;
    planDuration: number;
    planProgressCall: number;
    planRenewalCall: number;
    planUpdateWeek: number;
    isActive: boolean;
    createdAt: string;
  }>;
  clients: Array<{
    _id: string;
    name: string;
    email: string;
    status: string;
  }>;
  createdAt: string;
}

export default function TeamPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchTeam(params.id as string);
    }
  }, [params.id]);

  const fetchTeam = async (teamId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/get-team?id=${teamId}`);
      const data = await response.json();
      if (response.ok) {
        setTeam(data.team);
      } else {
        toast.error(data.error || "Failed to fetch team");
      }
    } catch (error) {
      console.error("Error fetching team:", error);
      toast.error("Failed to fetch team");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = () => {
    // TODO: Open add client modal
    toast.info("Add client functionality coming soon!");
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Team not found
        </h1>
        <Link href="/teams">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/teams">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-gray-600 mt-1">
              Created {new Date(team.createdAt).toLocaleDateString()} by{" "}
              {team.owner.name}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={handleAddClient}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Team Actions (Coaches, Plans, Client Stats) */}
      <TeamActions
        coaches={team.coaches}
        plans={team.plans}
        clients={team.clients}
        ownerId={team.owner._id}
        currentUserId={session?.user?.id || ""}
        teamId={team._id}
        onDataUpdated={() => fetchTeam(team._id)}
      />

      {/* Team Clients List */}
      <TeamClientsList clients={team.clients} onAddClient={handleAddClient} />
    </div>
  );
}
