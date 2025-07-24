import { CoachList } from "./coach-list";
import { TrainingPackages } from "./training-packages";
import { PendingInvites } from "./pending-invites";

interface Coach {
  _id: string;
  name: string;
  email: string;
}

interface Package {
  packageName: string;
  packageDuration: number;
  planProgressCall: number;
  planRenewalCall: number;
  planUpdateWeek: number;
  packageColor?: string;
  isActive: boolean;
  createdAt: string;
}

interface Client {
  _id: string;
  name: string;
  email: string;
  status: string;
}

interface TeamActionsProps {
  coaches: Coach[];
  packages: Package[];
  clients: Client[];
  ownerId: string;
  currentUserId: string;
  teamId: string;
  onDataUpdated: () => void;
}

export function TeamActions({
  coaches,
  packages,
  clients,
  ownerId,
  currentUserId,
  teamId,
  onDataUpdated,
}: TeamActionsProps) {
  const isOwner = ownerId === currentUserId;

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CoachList
          coaches={coaches}
          ownerId={ownerId}
          teamId={teamId}
          onInviteSent={onDataUpdated}
        />
        <TrainingPackages
          packages={packages}
          teamId={teamId}
          onPackagesUpdated={onDataUpdated}
        />
        <div className="space-y-4">
          <div className="text-2xl font-bold mb-2">{clients.length}</div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Active:</span>
              <span>{clients.filter((c) => c.status === "active").length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Inactive:</span>
              <span>
                {clients.filter((c) => c.status === "inactive").length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Invites (Owner Only) */}
      <PendingInvites
        teamId={teamId}
        isOwner={isOwner}
        onInvitesCancelled={onDataUpdated}
      />
    </div>
  );
}
