"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TeamsPageSkeleton } from "@/components/team-skeleton";
import { Plus, Users } from "lucide-react";
import { TeamCard } from "@/components/custom/team-card";

export interface Team {
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
    isActive: boolean;
  }>;
  clients: string[];
  createdAt: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/teams/get-all-teams");
      const data = await response.json();
      if (response.ok) {
        setTeams(data.teams);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!teamName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/teams/add-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName }),
      });

      if (response.ok) {
        setTeamName("");
        setDialogOpen(false);
        fetchTeams();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Error creating team");
    }
    setCreating(false);
  };

  if (loading) {
    return <TeamsPageSkeleton />;
  }

  return (
    <section className="section-body">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600 mt-2">
            Manage your coaching teams and collaborate with other coaches.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  onKeyDown={(e) => e.key === "Enter" && createTeam()}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={createTeam}
                  disabled={creating || !teamName.trim()}
                >
                  {creating ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No teams yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first team to manage clients and
              collaborate with other coaches.
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Team
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard team={team} key={team._id} />
          ))}
        </div>
      )}
    </section>
  );
}
