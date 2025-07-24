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
import {
  calculateClientDates,
  formatDateForDisplay,
} from "@/utils/dateCalculations";

// Remove the existing helper functions and replace with:
const isAfter = (date1: Date, date2: Date): boolean => {
  return date1.getTime() > date2.getTime();
};

const isBefore = (date1: Date, date2: Date): boolean => {
  return date1.getTime() < date2.getTime();
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

interface Coach {
  _id: string;
  name: string;
  email: string;
}

interface Package {
  packageName: string;
  durationInWeeks: number;
  progressIntervalInWeeks: number;
  planUpdateIntervalInWeeks: number;
  renewalCallWeeksBeforeEnd: number;
  packageColor?: string;
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
  selectedPackage: string;
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
  packages: Package[];
  settings: TeamSettings;
  onClientUpdated: () => void;
  onClientDeleted: () => void;
}

export function ClientsTable({
  clients,
  coaches,
  packages,
  settings,
  onClientUpdated,
  onClientDeleted,
}: ClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [coachFilter, setCoachFilter] = useState<string>("all");
  const [packageFilter, setPackageFilter] = useState<string>("all");
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

    // Package filter
    if (packageFilter !== "all") {
      result = result.filter(
        (client) => client.selectedPackage === packageFilter
      );
    }

    setFilteredClients(result);
  }, [clients, searchTerm, statusFilter, coachFilter, packageFilter]);

  const calculateDates = (client: Client) => {
    const pkg = packages.find((p) => p.packageName === client.selectedPackage);
    if (!pkg) return null;

    const packageConfig = {
      durationInWeeks: pkg.durationInWeeks,
      progressIntervalInWeeks: pkg.progressIntervalInWeeks,
      planUpdateIntervalInWeeks: pkg.planUpdateIntervalInWeeks,
      renewalCallWeeksBeforeEnd: pkg.renewalCallWeeksBeforeEnd,
    };

    const dates = calculateClientDates(
      client.startDate,
      packageConfig,
      client.customRenewalCallDate
    );

    return {
      renewalCallDate: dates.renewalCallDate,
      progressCallDate: dates.nextProgressCallDate,
      planUpdateDate: dates.nextPlanUpdateDate,
      packageEndDate: dates.packageEndDate,
    };
  };

  const formatDateDisplay = (date: Date) => {
    return formatDateForDisplay(date, settings.dateFormat);
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

  // Get unique packages for filter
  const uniquePackages = Array.from(
    new Set(clients.map((client) => client.selectedPackage))
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

          <Select value={packageFilter} onValueChange={setPackageFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Package" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Packages</SelectItem>
              {uniquePackages.map((pkg, index) => (
                <SelectItem key={`package-${index}-${pkg}`} value={pkg}>
                  {pkg}
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
              {settings.clientFormFields.email && <TableHead>Email</TableHead>}
              {settings.clientFormFields.phone && <TableHead>Phone</TableHead>}
              {settings.clientFormFields.age && <TableHead>Age</TableHead>}
              {settings.clientFormFields.gender && (
                <TableHead>Gender</TableHead>
              )}
              <TableHead>Coach</TableHead>
              {settings.clientFormFields.startDate && (
                <TableHead>Start Date</TableHead>
              )}
              <TableHead>Training Package</TableHead>
              <TableHead>Package End Date</TableHead>
              {settings.clientFormFields.currentWeight && (
                <TableHead>Current Weight</TableHead>
              )}
              {settings.clientFormFields.targetWeight && (
                <TableHead>Target Weight</TableHead>
              )}
              {settings.clientFormFields.height && (
                <TableHead>Height</TableHead>
              )}
              {settings.clientFormFields.membershipType && (
                <TableHead>Membership Type</TableHead>
              )}
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
              {settings.clientFormFields.status && (
                <TableHead>Status</TableHead>
              )}
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                {(() => {
                  const totalColumns =
                    Object.values(settings.clientFormFields).filter(Boolean)
                      .length + 3; // +3 for Coach, Training Package, Package End Date, and Actions columns
                  return (
                    <TableCell
                      colSpan={totalColumns}
                      className="h-24 text-center"
                    >
                      No clients found.
                    </TableCell>
                  );
                })()}
              </TableRow>
            ) : (
              filteredClients.map((client) => {
                const dates = calculateDates(client);
                const pkg = packages.find(
                  (p) => p.packageName === client.selectedPackage
                );

                return (
                  <TableRow key={client._id}>
                    <TableCell>
                      <div className="font-medium">{client.name}</div>
                    </TableCell>
                    {settings.clientFormFields.email && (
                      <TableCell>{client.email || "-"}</TableCell>
                    )}
                    {settings.clientFormFields.phone && (
                      <TableCell>{client.phone || "-"}</TableCell>
                    )}
                    {settings.clientFormFields.age && (
                      <TableCell>{client.age || "-"}</TableCell>
                    )}
                    {settings.clientFormFields.gender && (
                      <TableCell>{client.gender || "-"}</TableCell>
                    )}
                    <TableCell>
                      {client.assignedCoach && client.assignedCoach.name
                        ? client.assignedCoach.name
                        : "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor: pkg?.packageColor || "#3b82f6",
                          color: "white",
                          border: "none",
                        }}
                      >
                        {client.selectedPackage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {dates && (
                        <div className="text-gray-700">
                          {formatDateDisplay(dates.packageEndDate)}
                        </div>
                      )}
                    </TableCell>
                    {settings.clientFormFields.startDate && (
                      <TableCell>
                        {formatDateDisplay(new Date(client.startDate))}
                      </TableCell>
                    )}
                    {settings.clientFormFields.currentWeight && (
                      <TableCell>
                        {client.currentWeight
                          ? `${client.currentWeight} kg`
                          : "-"}
                      </TableCell>
                    )}
                    {settings.clientFormFields.targetWeight && (
                      <TableCell>
                        {client.targetWeight
                          ? `${client.targetWeight} kg`
                          : "-"}
                      </TableCell>
                    )}
                    {settings.clientFormFields.height && (
                      <TableCell>
                        {client.height ? `${client.height} cm` : "-"}
                      </TableCell>
                    )}
                    {settings.clientFormFields.membershipType && (
                      <TableCell>{client.membershipType || "-"}</TableCell>
                    )}

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
                        {dates && dates.progressCallDate && (
                          <div
                            className={getDateClassName(dates.progressCallDate)}
                          >
                            {formatDateDisplay(dates.progressCallDate)}
                            {isDateOverdue(dates.progressCallDate) && (
                              <AlertCircle className="inline-block ml-1 h-3 w-3" />
                            )}
                          </div>
                        )}
                        {dates && !dates.progressCallDate && (
                          <span className="text-gray-400">
                            No upcoming calls
                          </span>
                        )}
                      </TableCell>
                    )}

                    {settings.clientFormFields.planUpdateDate && (
                      <TableCell>
                        {dates && dates.planUpdateDate && (
                          <div
                            className={getDateClassName(dates.planUpdateDate)}
                          >
                            {formatDateDisplay(dates.planUpdateDate)}
                            {isDateOverdue(dates.planUpdateDate) && (
                              <AlertCircle className="inline-block ml-1 h-3 w-3" />
                            )}
                          </div>
                        )}
                        {dates && !dates.planUpdateDate && (
                          <span className="text-gray-400">
                            No upcoming updates
                          </span>
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

                    {settings.clientFormFields.status && (
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
                    )}

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
