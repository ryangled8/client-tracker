import Link from "next/link";
import React from "react";
import { Team } from "@/app/teams/page";

interface TeamCardProps {
  team: Team;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team }) => {
  return (
    <Link href={`/team/${team._id}`} className="border rounded-lg p-4">
      <h2 className="font-bold text-2xl">{team.name}</h2>

      <p className="text-sm">
        <span>{team.clients.length}</span> clients
      </p>

      <p className="text-sm">
        <span>{team.coaches.length}</span> coaches
      </p>

      {/* CTA Go to team */}
      <p className="text-sm text-blue-600 hover:underline mt-2">Go to team</p>
    </Link>
  );
};
