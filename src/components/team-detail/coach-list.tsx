import { Badge } from "@/components/ui/badge";
import { CoachInvite } from "./coach-invite";

interface Coach {
  _id: string;
  name: string;
  email: string;
}

interface CoachListProps {
  coaches: Coach[];
  ownerId: string;
  teamId: string;
  onInviteSent: () => void;
}

export function CoachList({
  coaches,
  ownerId,
  teamId,
  onInviteSent,
}: CoachListProps) {
  return (
    <>
      <div className="mt-8">
        <div className="text-sm mb-4">
          <div className="text-blk-60 mb-1">Coaches</div>

          <div className="flex flex-col gap-1">
            {coaches.map((coach) => (
              <div key={coach._id} className="space-x-1.5">
                <span>{coach.name}</span>

                {coach._id === ownerId && (
                  <Badge variant="secondary">Head Coach</Badge>
                )}
                {coach._id !== ownerId && (
                  <Badge variant="outline">Coach</Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <CoachInvite teamId={teamId} onInviteSent={onInviteSent} />
      </div>
    </>
  );
}
