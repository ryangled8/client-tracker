import { TrainingPackages } from "./training-packages";
import { TeamSettingsModal } from "./team-settings-modal";
import { CoachInvite } from "./coach-invite";
import { Coach } from "@/types";

interface Package {
  packageName: string;
  packageDuration: number;
  planProgressCall: number;
  planRenewalCall: number;
  planUpdateWeek: number;
  packageColor?: string;
  isActive: boolean;
  isRecurring: boolean;
  createdAt: string;
}

interface Client {
  _id: string;
  name: string;
  email: string;
  status: string;
}

interface Team {
  _id: string;
  name: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  settings: any;
  coaches: Coach[];
}

interface TeamActionsProps {
  team: Team;
  packages: Package[];
  clients: Client[];
  ownerId: string;
  currentUserId: string;
  teamId: string;
  onDataUpdated: () => void;
}

export function TeamActions({
  team,
  packages,
  ownerId,
  currentUserId,
  teamId,
  onDataUpdated,
}: TeamActionsProps) {
  const isOwner = ownerId === currentUserId;

  return (
    <div className="flex gap-2">
      {/* Toggle Add Package Modal */}
      <TrainingPackages
        packages={packages}
        teamId={team._id}
        onPackagesUpdated={onDataUpdated}
        hidePackageList
      />

      {isOwner && <CoachInvite teamId={teamId} onInviteSent={onDataUpdated} />}

      {isOwner && (
        <TeamSettingsModal team={team} onSettingsUpdated={onDataUpdated} />
      )}
    </div>
  );
}
