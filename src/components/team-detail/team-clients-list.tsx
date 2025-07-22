"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus } from "lucide-react";

interface Client {
  _id: string;
  name: string;
  email: string;
  status: string;
}

interface TeamClientsListProps {
  clients: Client[];
  onAddClient: () => void;
}

export function TeamClientsList({
  clients,
  onAddClient,
}: TeamClientsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Clients</CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No clients yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start by adding your first client to this team.
            </p>
            <Button onClick={onAddClient}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Client
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <div
                key={client._id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-gray-500">{client.email}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      client.status === "active" ? "default" : "secondary"
                    }
                  >
                    {client.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
            <div className="text-center pt-4 border-t">
              <Button variant="outline" onClick={onAddClient}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Client
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
