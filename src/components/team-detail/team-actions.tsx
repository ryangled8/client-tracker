import { CoachList } from "./coach-list";
import { TrainingPlans } from "./training-plans";

interface Coach {
  _id: string;
  name: string;
  email: string;
}

interface Plan {
  planName: string;
  planDuration: number;
  planProgressCall: number;
  planRenewalCall: number;
  planUpdateWeek: number;
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
  plans: Plan[];
  clients: Client[];
  ownerId: string;
  teamId: string;
  onDataUpdated: () => void;
}

export function TeamActions({
  coaches,
  plans,
  ownerId,
  teamId,
  onDataUpdated,
}: TeamActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CoachList
        coaches={coaches}
        ownerId={ownerId}
        teamId={teamId}
        onInviteSent={onDataUpdated}
      />

      <TrainingPlans
        plans={plans}
        teamId={teamId}
        onPlansUpdated={onDataUpdated}
      />
    </div>
  );
}
