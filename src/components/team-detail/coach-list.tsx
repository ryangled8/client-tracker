import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CoachInvite } from "./coach-invite";
import { Users } from "lucide-react";

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Coaches
          </CardTitle>
          <CoachInvite teamId={teamId} onInviteSent={onInviteSent} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {coaches.map((coach) => (
            <div key={coach._id} className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">{coach.name}</span>
                <p className="text-xs text-gray-500">{coach.email}</p>
              </div>
              {coach._id === ownerId && (
                <Badge variant="secondary">Owner</Badge>
              )}
              {coach._id !== ownerId && <Badge variant="outline">Coach</Badge>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
