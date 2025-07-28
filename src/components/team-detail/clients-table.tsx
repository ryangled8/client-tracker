"use client";

import React from "react";

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
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import type { TeamSettings } from "@/types";
import {
  calculateClientDates,
  formatDateForDisplay,
} from "@/utils/dateCalculations";
import { EditClientModal } from "./edit-client-modal";

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
  status: "active" | "inactive" | "paused";
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
      allProgressCallDates: dates.allProgressCallDates,
      allPlanUpdateDates: dates.allPlanUpdateDates,
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
    if (isDateOverdue(date)) return "text-red-600 font-bold";
    if (isDateSoon(date)) return "text-amber-600 font-bold";
    return "text-gray-700";
  };

  const toggleRowExpansion = (clientId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedRows(newExpanded);
  };

  const renderExpandedContent = (client: Client) => {
    const dates = calculateDates(client);
    const pkg = packages.find((p) => p.packageName === client.selectedPackage);
    if (!dates || !pkg) return null;

    const now = new Date();

    // Separate past and future dates for progress calls
    const pastProgressCalls = dates.allProgressCallDates.filter((date) =>
      isBefore(date, now)
    );
    const futureProgressCalls = dates.allProgressCallDates.filter((date) =>
      isAfter(date, now)
    );

    // Separate past and future dates for plan updates
    const pastPlanUpdates = dates.allPlanUpdateDates.filter((date) =>
      isBefore(date, now)
    );
    const futurePlanUpdates = dates.allPlanUpdateDates.filter((date) =>
      isAfter(date, now)
    );

    return (
      <div className="p-2">
        <p className="mb-2.5 text-xs">
          Expanded for: <span className="font-bold">{client.name}</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress Calls */}
          <div>
            <h4 className="font-medium text-xs mb-0.5 text-gray-900">
              Progress Calls
            </h4>
            <div className="space-y-0.5">
              {pastProgressCalls.map((date, index) => (
                <div
                  key={`past-progress-${index}`}
                  className="text-xs text-gray-500"
                >
                  {formatDateDisplay(date)} (completed)
                </div>
              ))}
              {futureProgressCalls.map((date, index) => (
                <div
                  key={`future-progress-${index}`}
                  className={`text-xs ${
                    index === 0 ? "text-green-600 font-bold" : "text-gray-500"
                  }`}
                >
                  {formatDateDisplay(date)}{" "}
                  {index === 0 ? "(next)" : "(upcoming)"}
                </div>
              ))}
              {dates.allProgressCallDates.length === 0 && (
                <div className="text-sm text-gray-400">
                  No progress calls scheduled
                </div>
              )}
            </div>
          </div>

          {/* Plan Updates */}
          <div>
            <h4 className="font-medium text-xs mb-0.5 text-gray-900">
              Plan Updates
            </h4>
            <div className="space-y-0.5">
              {pastPlanUpdates.map((date, index) => (
                <div
                  key={`past-update-${index}`}
                  className="text-xs text-gray-500"
                >
                  {formatDateDisplay(date)} (completed)
                </div>
              ))}
              {futurePlanUpdates.map((date, index) => (
                <div
                  key={`future-update-${index}`}
                  className={`text-xs ${
                    index === 0 ? "text-green-600 font-bold" : "text-gray-500"
                  }`}
                >
                  {formatDateDisplay(date)}{" "}
                  {index === 0 ? "(next)" : "(upcoming)"}
                </div>
              ))}
              {dates.allPlanUpdateDates.length === 0 && (
                <div className="text-sm text-gray-400">
                  No plan updates scheduled
                </div>
              )}
            </div>
          </div>

          {/* Renewal Call */}
          <div>
            <h4 className="font-medium text-xs mb-0.5 text-gray-900 flex gap-1.5 items-center">
              Renewal Call
              <div className="text-gray-500 text-xs">
                ({pkg.renewalCallWeeksBeforeEnd} weeks before package end)
              </div>
            </h4>
            <div className="space-y-0.5">
              <div
                className={`text-xs text-gray-700 flex items-center gap-1 ${
                  isDateOverdue(dates.renewalCallDate) &&
                  "text-red-600 font-bold"
                }`}
              >
                {formatDateDisplay(dates.renewalCallDate)}
                {isDateOverdue(dates.renewalCallDate) && (
                  <AlertCircle className="inline-block ml-1 h-3 w-3" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleClientUpdated = (updatedClient: Client) => {
    // Update the client in the local state without full page refresh
    onClientUpdated();
    toast.success("Client updated successfully");
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
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="border-l w-[180px]">Client</TableHead>
              <TableHead className="border-l w-[150px]">Coach</TableHead>
              {settings.clientFormFields.startDate && (
                <TableHead className="border-l w-[200px]">Start Date</TableHead>
              )}
              <TableHead className="border-l w-[200px]">
                Training Package
              </TableHead>
              <TableHead className="border-l w-[200px]">
                Package End Date
              </TableHead>
              {settings.clientFormFields.progressCallDate && (
                <TableHead className="border-l w-[200px]">
                  Next Progress Call
                </TableHead>
              )}
              {settings.clientFormFields.planUpdateDate && (
                <TableHead className="border-l w-[200px]">
                  Next Plan Update
                </TableHead>
              )}
              {settings.clientFormFields.renewalCallDate && (
                <TableHead className="border-l w-[200px]">
                  Renewal Call
                </TableHead>
              )}
              {settings.clientFormFields.status && (
                <TableHead className="border-l w-[100px]">Status</TableHead>
              )}

              {/* Additional fields from settings */}
              {settings.clientFormFields.email && (
                <TableHead className="border-l w-[250px]">Email</TableHead>
              )}
              {settings.clientFormFields.phone && (
                <TableHead className="border-l w-[140px]">Phone</TableHead>
              )}
              {settings.clientFormFields.age && (
                <TableHead className="border-l w-[80px]">Age</TableHead>
              )}
              {settings.clientFormFields.gender && (
                <TableHead className="border-l w-[100px]">Gender</TableHead>
              )}
              {settings.clientFormFields.currentWeight && (
                <TableHead className="border-l w-[120px]">
                  Current Weight
                </TableHead>
              )}
              {settings.clientFormFields.targetWeight && (
                <TableHead className="border-l w-[120px]">
                  Target Weight
                </TableHead>
              )}
              {settings.clientFormFields.height && (
                <TableHead className="border-l w-[100px]">Height</TableHead>
              )}
              {settings.clientFormFields.membershipType && (
                <TableHead className="border-l w-[150px]">
                  Membership Type
                </TableHead>
              )}

              {/* Notes always comes last before actions */}
              {settings.clientFormFields.notes && (
                <TableHead className="border-l w-[300px]">Notes</TableHead>
              )}
              <TableHead className="border-l w-[80px]">
                <div className="flex items-center justify-between">
                  <span>Actions</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    title="Reorder columns (coming soon)"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </Button>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                {(() => {
                  // Count all visible columns
                  let columnCount = 5; // Expand, Client, Coach, Training Package, Package End Date (always visible)
                  if (settings.clientFormFields.startDate) columnCount++;
                  if (settings.clientFormFields.progressCallDate) columnCount++;
                  if (settings.clientFormFields.planUpdateDate) columnCount++;
                  if (settings.clientFormFields.renewalCallDate) columnCount++;
                  if (settings.clientFormFields.status) columnCount++;
                  if (settings.clientFormFields.email) columnCount++;
                  if (settings.clientFormFields.phone) columnCount++;
                  if (settings.clientFormFields.age) columnCount++;
                  if (settings.clientFormFields.gender) columnCount++;
                  if (settings.clientFormFields.currentWeight) columnCount++;
                  if (settings.clientFormFields.targetWeight) columnCount++;
                  if (settings.clientFormFields.height) columnCount++;
                  if (settings.clientFormFields.membershipType) columnCount++;
                  if (settings.clientFormFields.notes) columnCount++;
                  columnCount++; // Actions column

                  return (
                    <TableCell
                      colSpan={columnCount}
                      className="h-24 text-center"
                    >
                      No clients found.
                    </TableCell>
                  );
                })()}
              </TableRow>
            ) : (
              <>
                {filteredClients.map((client, index) => {
                  const dates = calculateDates(client);
                  const pkg = packages.find(
                    (p) => p.packageName === client.selectedPackage
                  );
                  const isExpanded = expandedRows.has(client._id);
                  const isEvenRow = index % 2 === 0;

                  return (
                    <React.Fragment key={client._id}>
                      <TableRow
                        className={isEvenRow ? "bg-white" : "bg-gray-50"}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleRowExpansion(client._id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>

                        <TableCell className="border-l">
                          <div className="font-bold">{client.name}</div>
                        </TableCell>

                        <TableCell className="border-l">
                          {client.assignedCoach && client.assignedCoach.name
                            ? client.assignedCoach.name
                            : "Unassigned"}
                        </TableCell>

                        {settings.clientFormFields.startDate && (
                          <TableCell className="border-l">
                            {formatDateDisplay(new Date(client.startDate))}
                          </TableCell>
                        )}

                        <TableCell className="border-l">
                          <Badge
                            className="rounded-full"
                            style={{
                              backgroundColor: pkg?.packageColor || "#3b82f6",
                              color: "white",
                              border: "none",
                            }}
                          >
                            {client.selectedPackage}
                          </Badge>
                        </TableCell>

                        <TableCell className="border-l">
                          {dates && (
                            <div className="text-gray-700">
                              {formatDateDisplay(dates.packageEndDate)}
                            </div>
                          )}
                        </TableCell>

                        {settings.clientFormFields.progressCallDate && (
                          <TableCell className="border-l">
                            {dates && dates.progressCallDate && (
                              <div
                                className={getDateClassName(
                                  dates.progressCallDate
                                )}
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
                          <TableCell className="border-l">
                            {dates && dates.planUpdateDate && (
                              <div
                                className={getDateClassName(
                                  dates.planUpdateDate
                                )}
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

                        {settings.clientFormFields.renewalCallDate && (
                          <TableCell className="border-l">
                            {dates && (
                              <div
                                className={getDateClassName(
                                  dates.renewalCallDate
                                )}
                              >
                                {formatDateDisplay(dates.renewalCallDate)}
                                {isDateOverdue(dates.renewalCallDate) && (
                                  <AlertCircle className="inline-block ml-1 h-3 w-3" />
                                )}
                              </div>
                            )}
                          </TableCell>
                        )}

                        {settings.clientFormFields.status && (
                          <TableCell className="border-l">
                            <Badge
                              className="rounded-full capitalize"
                              style={{
                                backgroundColor:
                                  client.status === "active"
                                    ? "#22c55e"
                                    : client.status === "paused"
                                    ? "#f97316"
                                    : "#ec4899",
                                color: "white",
                                border: "none",
                              }}
                            >
                              {client.status}
                            </Badge>
                          </TableCell>
                        )}

                        {/* Additional fields from settings */}
                        {settings.clientFormFields.email && (
                          <TableCell className="border-l">
                            {client.email || "-"}
                          </TableCell>
                        )}
                        {settings.clientFormFields.phone && (
                          <TableCell className="border-l">
                            {client.phone || "-"}
                          </TableCell>
                        )}
                        {settings.clientFormFields.age && (
                          <TableCell className="border-l">
                            {client.age || "-"}
                          </TableCell>
                        )}
                        {settings.clientFormFields.gender && (
                          <TableCell className="border-l">
                            {client.gender || "-"}
                          </TableCell>
                        )}
                        {settings.clientFormFields.currentWeight && (
                          <TableCell className="border-l">
                            {client.currentWeight
                              ? `${client.currentWeight} kg`
                              : "-"}
                          </TableCell>
                        )}
                        {settings.clientFormFields.targetWeight && (
                          <TableCell className="border-l">
                            {client.targetWeight
                              ? `${client.targetWeight} kg`
                              : "-"}
                          </TableCell>
                        )}
                        {settings.clientFormFields.height && (
                          <TableCell className="border-l">
                            {client.height ? `${client.height} cm` : "-"}
                          </TableCell>
                        )}
                        {settings.clientFormFields.membershipType && (
                          <TableCell className="border-l">
                            {client.membershipType || "-"}
                          </TableCell>
                        )}

                        {/* Notes always comes last before actions */}
                        {settings.clientFormFields.notes && (
                          <TableCell className="border-l">
                            {client.notes ? (
                              <div
                                className="max-w-[280px] truncate"
                                title={client.notes}
                              >
                                {client.notes}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        )}

                        <TableCell className="border-l">
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
                                onClick={() => handleEditClient(client)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>
                                Change Status
                              </DropdownMenuLabel>
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

                      {/* Expanded content */}
                      {isExpanded && (
                        <TableRow
                          className={isEvenRow ? "bg-white" : "bg-gray-50"}
                        >
                          <TableCell colSpan={100}>
                            {renderExpandedContent(client)}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Client Modal */}
      <EditClientModal
        client={editingClient}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingClient(null);
        }}
        coaches={coaches}
        packages={packages}
        settings={settings}
        onClientUpdated={handleClientUpdated}
      />
    </div>
  );
}
