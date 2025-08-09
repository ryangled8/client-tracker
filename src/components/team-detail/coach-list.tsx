import { Badge } from "@/components/ui/badge";
import { Coach } from "@/types";

interface CoachListProps {
  coaches: Coach[];
  ownerId: string;
}

export function CoachList({ coaches, ownerId }: CoachListProps) {
  return (
    <div className="flex flex-col gap-1">
      {coaches.map((coach) => (
        <div key={coach._id} className="space-x-1.5 flex items-center">
          <span>{coach.user.name}</span>

          {coach.user._id === ownerId && (
            <Badge
              variant="secondary"
              style={{ backgroundColor: coach.coachColor, color: "#fff" }}
            >
              Head Coach
            </Badge>
          )}

          {coach.user._id !== ownerId && (
            <Badge
              variant="outline"
              style={{
                backgroundColor: coach.coachColor,
                color: "#fff",
                borderColor: coach.coachColor,
              }}
            >
              Coach
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
