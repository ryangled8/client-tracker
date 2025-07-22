"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateClientDates, formatDate } from "@/utils/dateCalculations";

interface Team {
  _id: string;
  name: string;
  plans: Array<{
    planName: string;
    planDuration: number;
    planProgressCall: number;
    planRenewalCall: number;
    planUpdateWeek: number;
    isActive: boolean;
  }>;
}

interface Client {
  _id: string;
  name: string;
  email?: string;
  selectedPlan: string;
  startDate: string;
  status: string;
  team: { _id: string; name: string };
  assignedCoach: { _id: string; name: string };
}

export default function HomePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [teamName, setTeamName] = useState("");
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    selectedPlan: "",
    team: "",
    assignedCoach: "",
  });

  // Fetch teams on component mount
  useEffect(() => {
    fetchTeams();
    fetchClients();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams/get-all-teams");
      const data = await response.json();
      if (response.ok) {
        setTeams(data.teams);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients/get-all-clients");
      const data = await response.json();
      if (response.ok) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const createTeam = async () => {
    if (!teamName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/teams/add-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName }),
      });

      if (response.ok) {
        setTeamName("");
        fetchTeams();
        alert("Team created successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Error creating team");
    }
    setLoading(false);
  };

  const addPlanToTeam = async (teamId: string) => {
    const planName = prompt("Plan name:");
    const planDuration = prompt("Plan duration (weeks):");
    const planProgressCall = prompt("Progress call week:");
    const planRenewalCall = prompt("Renewal call week:");
    const planUpdateWeek = prompt("Plan update week:");

    if (
      !planName ||
      !planDuration ||
      !planProgressCall ||
      !planRenewalCall ||
      !planUpdateWeek
    )
      return;

    try {
      const team = teams.find((t) => t._id === teamId);
      if (!team) return;

      const updatedPlans = [
        ...team.plans,
        {
          planName,
          planDuration: Number.parseInt(planDuration),
          planProgressCall: Number.parseInt(planProgressCall),
          planRenewalCall: Number.parseInt(planRenewalCall),
          planUpdateWeek: Number.parseInt(planUpdateWeek),
          isActive: true,
          createdAt: new Date(),
        },
      ];

      const response = await fetch("/api/teams/update-team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, plans: updatedPlans }),
      });

      if (response.ok) {
        fetchTeams();
        alert("Plan added successfully!");
      }
    } catch (error) {
      console.error("Error adding plan:", error);
    }
  };

  const createClient = async () => {
    if (!clientForm.name || !clientForm.team || !clientForm.selectedPlan) {
      alert("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/clients/add-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...clientForm,
          assignedCoach: clientForm.assignedCoach || clientForm.team, // Default to team owner
        }),
      });

      if (response.ok) {
        setClientForm({
          name: "",
          email: "",
          selectedPlan: "",
          team: "",
          assignedCoach: "",
        });
        fetchClients();
        alert("Client created successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating client:", error);
      alert("Error creating client");
    }
    setLoading(false);
  };

  const getClientDates = (client: Client) => {
    const team = teams.find((t) => t._id === client.team._id);
    const plan = team?.plans.find((p) => p.planName === client.selectedPlan);

    if (!plan) return null;

    return calculateClientDates(client.startDate, plan);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Client Tracker - Test Dashboard</h1>

      {/* Create Team Section */}
      <Card>
        <CardHeader>
          <CardTitle>Create Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
            />
          </div>
          <Button onClick={createTeam} disabled={loading}>
            {loading ? "Creating..." : "Create Team"}
          </Button>
        </CardContent>
      </Card>

      {/* Teams List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Teams</CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <p>No teams found. Create your first team above!</p>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <div key={team._id} className="border p-4 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{team.name}</h3>
                    <Button size="sm" onClick={() => addPlanToTeam(team._id)}>
                      Add Plan
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Plans: {team.plans.filter((p) => p.isActive).length}</p>
                    {team.plans
                      .filter((p) => p.isActive)
                      .map((plan) => (
                        <div key={plan.planName} className="ml-4 mt-1">
                          • {plan.planName} ({plan.planDuration} weeks)
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Client Section */}
      {teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={clientForm.name}
                onChange={(e) =>
                  setClientForm({ ...clientForm, name: e.target.value })
                }
                placeholder="Enter client name"
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientForm.email}
                onChange={(e) =>
                  setClientForm({ ...clientForm, email: e.target.value })
                }
                placeholder="Enter client email"
              />
            </div>
            <div>
              <Label htmlFor="clientTeam">Team *</Label>
              <Select
                value={clientForm.team}
                onValueChange={(value) => {
                  setClientForm({
                    ...clientForm,
                    team: value,
                    selectedPlan: "",
                  });
                  setSelectedTeam(teams.find((t) => t._id === value) || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team._id} value={team._id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTeam && (
              <div>
                <Label htmlFor="clientPlan">Training Plan *</Label>
                <Select
                  value={clientForm.selectedPlan}
                  onValueChange={(value) =>
                    setClientForm({ ...clientForm, selectedPlan: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTeam.plans
                      .filter((p) => p.isActive)
                      .map((plan) => (
                        <SelectItem key={plan.planName} value={plan.planName}>
                          {plan.planName} ({plan.planDuration} weeks)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={createClient} disabled={loading}>
              {loading ? "Creating..." : "Add Client"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p>No clients found. Add your first client above!</p>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => {
                const dates = getClientDates(client);
                return (
                  <div key={client._id} className="border p-4 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{client.name}</h3>
                        <p className="text-sm text-gray-600">
                          Team: {client.team.name} | Plan: {client.selectedPlan}
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: {client.status} | Start:{" "}
                          {formatDate(new Date(client.startDate))}
                        </p>
                        {dates && (
                          <div className="text-sm text-gray-600 mt-2">
                            <p>
                              Progress Call:{" "}
                              {formatDate(dates.progressCallDate)}
                            </p>
                            <p>
                              Renewal Call: {formatDate(dates.renewalCallDate)}
                            </p>
                            <p>
                              Plan Update: {formatDate(dates.planUpdateDate)}
                            </p>
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          client.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {client.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// // app.brand.com

// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { redirect } from "next/navigation";
// import Link from "next/link";
// import LogoutButton from "@/components/logout-button";

// export default async function HomePage() {
//   const session = await getServerSession(authOptions);

//   if (!session) {
//     redirect("/login");
//   }

//   return (
//     <main className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
//         <div className="bg-white rounded-lg shadow p-6">
//           <div className="flex justify-between items-center mb-6">
//             <div>
//               <pre className="bg-green-100 border border-green-700 text-green-700 rounded-sm px-2.5 text-sm py-1.5 mb-4">
//                 Protected route - <b>app.domain.com</b>
//               </pre>

//               <h1 className="text-2xl font-bold text-gray-900">
//                 Welcome, {session.user.name}!
//               </h1>
//               <p className="text-gray-600">Email: {session.user.email}</p>
//               <p className="text-sm text-gray-500">
//                 User ID: {session.user.id}
//               </p>
//             </div>
//             <div className="flex space-x-3">
//               <Link
//                 href="/settings"
//                 className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
//               >
//                 Settings
//               </Link>
//               <LogoutButton />
//             </div>
//           </div>

//           <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
//             <h2 className="text-lg font-semibold text-blue-900 mb-2">
//               🎉 Authentication Setup Complete!
//             </h2>
//             <p className="text-blue-700">
//               You are now logged in and this page is protected by middleware.
//               Try logging out and accessing this page again.
//             </p>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }
