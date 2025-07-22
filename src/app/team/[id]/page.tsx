"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users, Calendar, Settings, Plus } from "lucide-react";
import Link from "next/link";

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
  plans: Array<{
    planName: string;
    planDuration: number;
    planProgressCall: number;
    planRenewalCall: number;
    planUpdateWeek: number;
    isActive: boolean;
    createdAt: string;
  }>;
  clients: Array<{
    _id: string;
    name: string;
    email: string;
    status: string;
  }>;
  createdAt: string;
}

export default function TeamPage() {
  const params = useParams();
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
        setTeam(data.team);
      }
    } catch (error) {
      console.error("Error fetching team:", error);
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
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
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
        <Link href="/teams">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/teams">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-gray-600 mt-1">
              Created {new Date(team.createdAt).toLocaleDateString()} by{" "}
              {team.owner.name}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Coaches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {team.coaches.map((coach) => (
                <div
                  key={coach._id}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm">{coach.name}</span>
                  {coach._id === team.owner._id && (
                    <Badge variant="secondary">Owner</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Training Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {team.plans.filter((p) => p.isActive).length === 0 ? (
                <p className="text-sm text-gray-500">No active plans</p>
              ) : (
                team.plans
                  .filter((p) => p.isActive)
                  .map((plan) => (
                    <div key={plan.planName} className="text-sm">
                      <div className="font-medium">{plan.planName}</div>
                      <div className="text-gray-500">
                        {plan.planDuration} weeks
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{team.clients.length}</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Active:</span>
                <span>
                  {team.clients.filter((c) => c.status === "active").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Inactive:</span>
                <span>
                  {team.clients.filter((c) => c.status === "inactive").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Clients */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {team.clients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No clients yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start by adding your first client to this team.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add First Client
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {team.clients.slice(0, 5).map((client) => (
                <div
                  key={client._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-gray-500">{client.email}</div>
                  </div>
                  <Badge
                    variant={
                      client.status === "active" ? "default" : "secondary"
                    }
                  >
                    {client.status}
                  </Badge>
                </div>
              ))}
              {team.clients.length > 5 && (
                <div className="text-center pt-4">
                  <Button variant="outline">
                    View All Clients ({team.clients.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
