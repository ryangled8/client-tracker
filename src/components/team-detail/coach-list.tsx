import { Badge } from "@/components/ui/badge";

interface Coach {
  _id: string;
  name: string;
  email: string;
}

interface CoachListProps {
  coaches: Coach[];
  ownerId: string;
}

export function CoachList({ coaches, ownerId }: CoachListProps) {
  return (
    <div className="flex flex-col gap-1">
      {coaches.map((coach) => (
        <div key={coach._id} className="space-x-1.5">
          <span>{coach.name}</span>

          {coach._id === ownerId && (
            <Badge variant="secondary">Head Coach</Badge>
          )}
          {coach._id !== ownerId && <Badge variant="outline">Coach</Badge>}
        </div>
      ))}
    </div>
  );
}
