"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamActions } from "@/components/team-detail/team-actions";
import { toast } from "sonner";
import { AddClientModal } from "@/components/team-detail/add-client-modal";
import { CSVUploadModal } from "@/components/team-detail/csv-upload-modal";
import { ClientsTable } from "@/components/team-detail/clients-table";
import type { TeamSettings } from "@/types";
import { ButtonRounded } from "@/components/custom/buttons/button-rounded";
import { CoachList } from "@/components/team-detail/coach-list";
import { PendingInvites } from "@/components/team-detail/pending-invites";
import { TrainingPackages } from "@/components/team-detail/training-packages";

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
  packages: Array<{
    packageName: string;
    packageDuration: number;
    planProgressCall: number;
    planRenewalCall: number;
    planUpdateWeek: number;
    packageColor?: string;
    isActive: boolean;
    isRecurring: boolean;
    createdAt: string;
  }>;
  clients: Array<{
    _id: string;
    name: string;
    email: string;
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
    customRenewalCallDate?: string;
    customProgressCallDate?: string;
    customPlanUpdateDate?: string;
  }>;
  createdAt: string;
  settings: TeamSettings;
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
        // If the team doesn't have settings yet, add default settings
        if (!data.team.settings) {
          data.team.settings = {
            clientFormFields: {
              name: true,
              email: true,
              phone: false,
              paymentDate: false,
              age: false,
              gender: false,
              assignedCoach: true,
              trainingPackage: true,
              renewalCallDate: true,
              progressCallDate: true,
              planUpdateDate: true,
              currentWeight: false,
              targetWeight: false,
              height: false,
              status: true,
              membershipType: false,
              startDate: true,
              notes: false,
            },
            noticePeriodWeeks: 2,
            dateFormat: "dd/mm/yyyy",
          };
        }
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
        <ButtonRounded
          url="/teams"
          variant="primary"
          icon="ArrowLeft"
          size="md"
        />
      </div>
    );
  }

  return (
    <section>
      {/* Header */}
      <header className="pb-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ButtonRounded
              url="/teams"
              variant="primary"
              icon="ArrowLeft"
              size="md"
            />

            <h1 className="h2 f-hr">{team.name}</h1>
          </div>

          {/* Main CTAs */}
          <TeamActions
            team={team}
            coaches={team.coaches}
            packages={team.packages}
            clients={team.clients}
            ownerId={team.owner._id}
            currentUserId={session?.user?.id || ""}
            teamId={team._id}
            onDataUpdated={() => fetchTeam(team._id)}
          />
        </div>

        {/* Coach list & Training Package List */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          <div className="col-span-2 text-sm">
            <div className="text-blk-60 mb-2">Coaches</div>

            <div className="border rounded-sm p-4 bg-[#F9FAFC]">
              <CoachList coaches={team.coaches} ownerId={team.owner._id} />

              <div className="mt-4">
                <PendingInvites
                  teamId={team._id}
                  isOwner={team.owner._id === session?.user?.id}
                  onInvitesCancelled={() => fetchTeam(team._id)}
                />
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <TrainingPackages
              packages={team.packages}
              teamId={team._id}
              onPackagesUpdated={() => fetchTeam(team._id)}
              hideCreatePackageButton
            />
          </div>
        </div>
      </header>

      {/* Team Clients Table */}
      <div className="mt-10">
        <div className="flex justify-between">
          <h2 className="f-hm mb-2">Team Clients</h2>

          <div className="flex gap-2">
            <CSVUploadModal
              teamId={team._id}
              coaches={team.coaches}
              packages={team.packages}
              settings={team.settings}
              onClientsImported={() => fetchTeam(team._id)}
            />

            <AddClientModal
              teamId={team._id}
              coaches={team.coaches}
              packages={team.packages}
              settings={team.settings}
              onClientAdded={() => fetchTeam(team._id)}
            />
          </div>
        </div>

        <ClientsTable
          clients={team.clients}
          coaches={team.coaches}
          packages={team.packages}
          settings={team.settings}
          onClientUpdated={() => fetchTeam(team._id)}
          onClientDeleted={() => fetchTeam(team._id)}
        />
      </div>
    </section>
  );
}
