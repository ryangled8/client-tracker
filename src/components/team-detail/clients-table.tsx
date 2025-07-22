"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import type { TeamSettings } from "@/types";

// Add these helper functions at the top of the component:
const addWeeks = (date: Date, weeks: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isAfter = (date1: Date, date2: Date): boolean => {
  return date1.getTime() > date2.getTime();
};

const isBefore = (date1: Date, date2: Date): boolean => {
  return date1.getTime() < date2.getTime();
};

const formatDate = (date: Date, format: string): string => {
  if (format === "dd/mm/yyyy") {
    return date.toLocaleDateString("en-GB");
  } else {
    return date.toLocaleDateString("en-US");
  }
};

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
}

interface Client {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  assignedCoach: {
    _id: string;
    name: string;
    email: string;
  };
  selectedPlan: string;
  startDate: string;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
  status: "active" | "inactive" | "paused" | "completed";
  membershipType?: string;
  notes?: string;
  customRenewalCallDate?: string;
  customProgressCallDate?: string;
  customPlanUpdateDate?: string;
}

interface ClientsTableProps {
  clients: Client[];
  coaches: Coach[];
  plans: Plan[];
  settings: TeamSettings;
  onClientUpdated: () => void;
  onClientDeleted: () => void;
}

export function ClientsTable({
  clients,
  coaches,
  plans,
  settings,
  onClientUpdated,
  onClientDeleted,
}: ClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [coachFilter, setCoachFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients);

  // Apply filters when any filter changes
  useEffect(() => {
    let result = [...clients];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (client) =>
          client.name.toLowerCase().includes(term) ||
          (client.email && client.email.toLowerCase().includes(term)) ||
          (client.phone && client.phone.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((client) => client.status === statusFilter);
    }

    // Coach filter
    if (coachFilter !== "all") {
      result = result.filter(
        (client) => client.assignedCoach._id === coachFilter
      );
    }

    // Plan filter
    if (planFilter !== "all") {
      result = result.filter((client) => client.selectedPlan === planFilter);
    }

    setFilteredClients(result);
  }, [clients, searchTerm, statusFilter, coachFilter, planFilter]);

  const calculateDates = (client: Client) => {
    const plan = plans.find((p) => p.planName === client.selectedPlan);
    if (!plan) return null;

    const startDate = new Date(client.startDate);

    const renewalCallDate = client.customRenewalCallDate
      ? new Date(client.customRenewalCallDate)
      : addWeeks(startDate, plan.planRenewalCall);

    const progressCallDate = client.customProgressCallDate
      ? new Date(client.customProgressCallDate)
      : addWeeks(startDate, plan.planProgressCall);

    const planUpdateDate = client.customPlanUpdateDate
      ? new Date(client.customPlanUpdateDate)
      : addWeeks(startDate, plan.planUpdateWeek);

    const planEndDate = addWeeks(startDate, plan.planDuration);

    return {
      renewalCallDate,
      progressCallDate,
      planUpdateDate,
      planEndDate,
    };
  };

  const formatDateDisplay = (date: Date) => {
    return formatDate(date, settings.dateFormat);
  };

  const isDateSoon = (date: Date) => {
    const today = new Date();
    const noticeDate = addDays(today, settings.noticePeriodWeeks * 7);
    return isAfter(date, today) && isBefore(date, noticeDate);
  };

  const isDateOverdue = (date: Date) => {
    const today = new Date();
    return isBefore(date, today);
  };

  const getDateClassName = (date: Date) => {
    if (isDateOverdue(date)) return "text-red-600 font-medium";
    if (isDateSoon(date)) return "text-amber-600 font-medium";
    return "text-gray-700";
  };

  const handleStatusChange = async (clientId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/clients/update-client", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onClientUpdated();
        toast.success("Client status updated");
      } else {
        toast.error(data.error || "Failed to update client status");
      }
    } catch (error) {
      console.error("Error updating client status:", error);
      toast.error("Failed to update client status");
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete client "${clientName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/clients/delete-client?id=${clientId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        onClientDeleted();
        toast.success(`Client "${clientName}" deleted successfully`);
      } else {
        toast.error(data.error || "Failed to delete client");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    }
  };

  const handleEditClient = (clientId: string) => {
    // TODO: Implement edit client functionality
    toast.info("Edit client functionality coming soon!");
  };

  // Get unique plans for filter
  const uniquePlans = Array.from(
    new Set(clients.map((client) => client.selectedPlan))
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={coachFilter} onValueChange={setCoachFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Coach" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Coaches</SelectItem>
              {coaches.map((coach) => (
                <SelectItem key={coach._id} value={coach._id}>
                  {coach.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {uniquePlans.map((plan) => (
                <SelectItem key={plan} value={plan}>
                  {plan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filteredClients.length} of {clients.length} clients
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Coach</TableHead>
              <TableHead>Training Plan</TableHead>
              <TableHead>Start Date</TableHead>
              {settings.clientFormFields.renewalCallDate && (
                <TableHead>Renewal Call</TableHead>
              )}
              {settings.clientFormFields.progressCallDate && (
                <TableHead>Progress Call</TableHead>
              )}
              {settings.clientFormFields.planUpdateDate && (
                <TableHead>Plan Update</TableHead>
              )}
              {settings.clientFormFields.notes && <TableHead>Notes</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => {
                const dates = calculateDates(client);

                return (
                  <TableRow key={client._id}>
                    <TableCell>
                      <div className="font-medium">{client.name}</div>
                      {client.email && (
                        <div className="text-xs text-gray-500">
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="text-xs text-gray-500">
                          {client.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{client.assignedCoach.name}</TableCell>
                    <TableCell>{client.selectedPlan}</TableCell>
                    <TableCell>
                      {formatDateDisplay(new Date(client.startDate))}
                    </TableCell>

                    {settings.clientFormFields.renewalCallDate && (
                      <TableCell>
                        {dates && (
                          <div
                            className={getDateClassName(dates.renewalCallDate)}
                          >
                            {formatDateDisplay(dates.renewalCallDate)}
                            {isDateOverdue(dates.renewalCallDate) && (
                              <AlertCircle className="inline-block ml-1 h-3 w-3" />
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}

                    {settings.clientFormFields.progressCallDate && (
                      <TableCell>
                        {dates && (
                          <div
                            className={getDateClassName(dates.progressCallDate)}
                          >
                            {formatDateDisplay(dates.progressCallDate)}
                            {isDateOverdue(dates.progressCallDate) && (
                              <AlertCircle className="inline-block ml-1 h-3 w-3" />
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}

                    {settings.clientFormFields.planUpdateDate && (
                      <TableCell>
                        {dates && (
                          <div
                            className={getDateClassName(dates.planUpdateDate)}
                          >
                            {formatDateDisplay(dates.planUpdateDate)}
                            {isDateOverdue(dates.planUpdateDate) && (
                              <AlertCircle className="inline-block ml-1 h-3 w-3" />
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}

                    {settings.clientFormFields.notes && (
                      <TableCell>
                        {client.notes ? (
                          <div
                            className="max-w-[200px] truncate"
                            title={client.notes}
                          >
                            {client.notes}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    )}

                    <TableCell>
                      <Badge
                        variant={
                          client.status === "active"
                            ? "default"
                            : client.status === "paused"
                            ? "outline"
                            : client.status === "completed"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {client.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleEditClient(client._id)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(client._id, "active")
                            }
                          >
                            Set as Active
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(client._id, "paused")
                            }
                          >
                            Set as Paused
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(client._id, "completed")
                            }
                          >
                            Set as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(client._id, "inactive")
                            }
                          >
                            Set as Inactive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteClient(client._id, client.name)
                            }
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
