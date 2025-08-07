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
  Maximize2,
  Minimize2,
  X,
  EyeIcon,
} from "lucide-react";
import type { TeamSettings } from "@/types";
import {
  calculateClientDates,
  formatDateForDisplay,
} from "@/utils/dateCalculations";
import { EditClientModal } from "./edit-client-modal";
import { Tag } from "@/components/tag";

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

const addWeeks = (date: Date, weeks: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
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
  isRecurring: boolean;
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
  paymentDate?: string;
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
  dueSoonFilter?: boolean;
  onDueSoonFilterChange?: (enabled: boolean) => void;
}

// Helper function to calculate all dates for recurring packages
const calculateRecurringDates = (
  startDate: Date,
  intervalWeeks: number,
  currentDate: Date = new Date(),
  weeksAhead = 12
) => {
  const dates: Date[] = [];
  let currentWeek = intervalWeeks;

  // Calculate all dates from start to current + weeksAhead
  const endDate = addWeeks(currentDate, weeksAhead);

  while (true) {
    const date = addWeeks(startDate, currentWeek);
    if (date > endDate) break;
    dates.push(date);
    currentWeek += intervalWeeks;
  }

  return dates;
};

// Local storage keys
const STORAGE_KEYS = {
  searchTerm: "clientsTable_searchTerm",
  statusFilter: "clientsTable_statusFilter",
  coachFilter: "clientsTable_coachFilter",
  packageFilter: "clientsTable_packageFilter",
  sortBy: "clientsTable_sortBy",
  dueSoonFilter: "clientsTable_dueSoonFilter",
};

export function ClientsTable({
  clients,
  coaches,
  packages,
  settings,
  onClientUpdated,
  onClientDeleted,
  dueSoonFilter: externalDueSoonFilter,
  onDueSoonFilterChange,
}: ClientsTableProps) {
  // Load initial values from localStorage or use defaults
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.searchTerm) || "";
    }
    return "";
  });

  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.statusFilter) || "all";
    }
    return "all";
  });

  const [coachFilter, setCoachFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.coachFilter) || "all";
    }
    return "all";
  });

  const [packageFilter, setPackageFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.packageFilter) || "all";
    }
    return "all";
  });

  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "due-soon" | "overdue"
  >(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.sortBy);
      return (
        (saved as "newest" | "oldest" | "due-soon" | "overdue") || "newest"
      );
    }
    return "newest";
  });

  const [dueSoonFilter, setDueSoonFilter] = useState(() => {
    if (externalDueSoonFilter !== undefined) {
      return externalDueSoonFilter;
    }
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.dueSoonFilter) === "true";
    }
    return false;
  });

  const [overdueFilter, setOverdueFilter] = useState(false);

  const [filteredClients, setFilteredClients] = useState<Client[]>(clients);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tableView, setTableView] = useState<"compact" | "relaxed">("relaxed");
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  // Sync external due soon filter
  useEffect(() => {
    if (externalDueSoonFilter !== undefined) {
      setDueSoonFilter(externalDueSoonFilter);
    }
  }, [externalDueSoonFilter]);

  // Check if any filters are active (different from defaults)
  const hasActiveFilters =
    searchTerm !== "" ||
    statusFilter !== "all" ||
    coachFilter !== "all" ||
    packageFilter !== "all" ||
    sortBy !== "newest" ||
    dueSoonFilter ||
    overdueFilter;
  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.searchTerm, searchTerm);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.statusFilter, statusFilter);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.coachFilter, coachFilter);
    }
  }, [coachFilter]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.packageFilter, packageFilter);
    }
  }, [packageFilter]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.sortBy, sortBy);
    }
  }, [sortBy]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_KEYS.dueSoonFilter,
        dueSoonFilter.toString()
      );
    }
    if (onDueSoonFilterChange) {
      onDueSoonFilterChange(dueSoonFilter);
    }
  }, [dueSoonFilter, onDueSoonFilterChange]);

  // Clear all filters function
  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCoachFilter("all");
    setPackageFilter("all");
    setSortBy("newest");
    setDueSoonFilter(false);
    setOverdueFilter(false);

    // Clear from localStorage
    if (typeof window !== "undefined") {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    }
  };

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/user/preferences");
        if (response.ok) {
          const data = await response.json();
          setTableView(data.preferences?.tableView || "relaxed");
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, []);

  const handleTableViewToggle = async () => {
    const newView = tableView === "compact" ? "relaxed" : "compact";
    setTableView(newView);

    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences: { tableView: newView },
        }),
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  const calculateDates = (client: Client) => {
    const pkg = packages.find((p) => p.packageName === client.selectedPackage);
    if (!pkg) return null;

    const startDate = new Date(client.startDate);

    if (pkg.isRecurring) {
      // For recurring packages, calculate extensive historical and future dates
      const progressDates = calculateRecurringDates(
        startDate,
        pkg.progressIntervalInWeeks,
        new Date(),
        12 // Show 12 weeks ahead
      );

      const planUpdateDates = calculateRecurringDates(
        startDate,
        pkg.planUpdateIntervalInWeeks,
        new Date(),
        12 // Show 12 weeks ahead
      );

      const now = new Date();
      const nextProgressCall = progressDates.find((date) => isAfter(date, now));
      const nextPlanUpdate = planUpdateDates.find((date) => isAfter(date, now));

      return {
        renewalCallDate: null, // No renewal for recurring packages
        progressCallDate: nextProgressCall || null,
        planUpdateDate: nextPlanUpdate || null,
        packageEndDate: null, // No end date for recurring packages
        allProgressCallDates: progressDates,
        allPlanUpdateDates: planUpdateDates,
        isRecurring: true,
      };
    } else {
      // For fixed packages, use existing logic
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
        isRecurring: false,
      };
    }
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
    if (isDateOverdue(date)) return "text-red-600 f-hm";
    if (isDateSoon(date)) return "text-amber-600 f-hm";
    return "text-gray-700";
  };

  // Function to get the earliest upcoming date for a client
  const getEarliestUpcomingDate = (client: Client) => {
    const dates = calculateDates(client);
    if (!dates) return null;

    const upcomingDates = [
      dates.progressCallDate,
      dates.planUpdateDate,
      dates.renewalCallDate,
    ].filter((date): date is Date => date !== null);

    if (upcomingDates.length === 0) return null;

    return upcomingDates.reduce((earliest, current) =>
      isBefore(current, earliest) ? current : earliest
    );
  };

  // Function to check if a client is overdue
  const isClientOverdue = (client: Client) => {
    const dates = calculateDates(client);
    if (!dates) return false;

    return (
      (dates.renewalCallDate && isDateOverdue(dates.renewalCallDate)) ||
      (dates.progressCallDate && isDateOverdue(dates.progressCallDate)) ||
      (dates.planUpdateDate && isDateOverdue(dates.planUpdateDate))
    );
  };

  // Function to check if a client is due soon (but not overdue)
  const isClientDueSoonOnly = (client: Client) => {
    const earliestDate = getEarliestUpcomingDate(client);
    if (!earliestDate) return false;
    return isDateSoon(earliestDate) && !isDateOverdue(earliestDate);
  };

  // Function to check if a client is due soon
  const isClientDueSoon = (client: Client) => {
    const earliestDate = getEarliestUpcomingDate(client);
    if (!earliestDate) return false;
    return isDateSoon(earliestDate) || isDateOverdue(earliestDate);
  };

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

    // Due soon filter - only show clients due soon (not overdue)
    if (dueSoonFilter) {
      result = result.filter((client) => isClientDueSoonOnly(client));
    }

    // Overdue filter
    if (overdueFilter) {
      result = result.filter((client) => isClientOverdue(client));
    }

    // Sort logic
    if (sortBy === "due-soon") {
      // Sort by earliest upcoming date, with due soon dates first
      result.sort((a, b) => {
        const dateA = getEarliestUpcomingDate(a);
        const dateB = getEarliestUpcomingDate(b);

        // Clients with no upcoming dates go to the end
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        // Sort by date (earliest first)
        return dateA.getTime() - dateB.getTime();
      });
    } else if (sortBy === "overdue") {
      // Sort by most overdue first
      result.sort((a, b) => {
        const dateA = getEarliestUpcomingDate(a);
        const dateB = getEarliestUpcomingDate(b);

        // Clients with no upcoming dates go to the end
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        const aOverdue = isDateOverdue(dateA);
        const bOverdue = isDateOverdue(dateB);

        // Overdue dates first
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        // Within overdue, sort by most overdue first (earliest date)
        return dateA.getTime() - dateB.getTime();
      });
    } else {
      // Sort by start date
      result.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return sortBy === "newest" ? dateB - dateA : dateA - dateB;
      });
    }

    setFilteredClients(result);
  }, [
    clients,
    searchTerm,
    statusFilter,
    coachFilter,
    packageFilter,
    sortBy,
    dueSoonFilter,
    settings.noticePeriodWeeks,
  ]);

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

        <div className="flex gap-12">
          {/* Progress Calls */}
          <div>
            <h4 className="font-medium text-xs mb-0.5 text-gray-900">
              Progress Calls
            </h4>
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
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
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
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
              {pkg?.isRecurring ? (
                <div className="text-gray-500 text-xs">
                  (Not applicable - recurring package)
                </div>
              ) : (
                <div className="text-gray-500 text-xs">
                  ({pkg?.renewalCallWeeksBeforeEnd} weeks before package end)
                </div>
              )}
            </h4>
            <div className="space-y-0.5">
              {pkg?.isRecurring ? (
                <div className="text-xs text-gray-400">
                  Package automatically renews
                </div>
              ) : dates.renewalCallDate ? (
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
              ) : (
                <div className="text-xs text-gray-400">
                  No renewal call scheduled
                </div>
              )}
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

  const handleClientUpdated = () => {
    // Update the client in the local state without full page refresh
    onClientUpdated();
    toast.success("Client updated successfully");
  };

  // Get unique packages for filter
  const uniquePackages = Array.from(
    new Set(clients.map((client) => client.selectedPackage))
  );

  const isCompact = tableView === "compact";
  const cellPadding = isCompact ? "px-3 py-1.5" : "px-4 py-3";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        {/* Overdue clients - only show if there are overdue clients */}
        {clients.filter((client) => {
          const dates = calculateDates(client);
          return (
            (dates &&
              (dates.renewalCallDate
                ? isDateOverdue(dates.renewalCallDate)
                : false)) ||
            (dates && dates.progressCallDate
              ? isDateOverdue(dates.progressCallDate)
              : false) ||
            (dates && dates.planUpdateDate
              ? isDateOverdue(dates.planUpdateDate)
              : false)
          );
        }).length > 0 && (
          <div className="flex gap-2">
            <div className="text-sm bg-red-50 border border-l-4 border-red-300 rounded-sm px-2.5 py-1.5 flex items-center justify-between w-fit gap-4">
              <div className="flex gap-1 items-center">
                <span className="f-hm">
                  {
                    clients.filter((client) => {
                      const dates = calculateDates(client);
                      return (
                        (dates &&
                          (dates.renewalCallDate
                            ? isDateOverdue(dates.renewalCallDate)
                            : false)) ||
                        (dates && dates.progressCallDate
                          ? isDateOverdue(dates.progressCallDate)
                          : false) ||
                        (dates && dates.planUpdateDate
                          ? isDateOverdue(dates.planUpdateDate)
                          : false)
                      );
                    }).length
                  }
                </span>
                <span>
                  clients have <span className="f-hm">overdue</span> dates
                </span>
              </div>
            </div>

            <div>
              {overdueFilter ? (
                <Button
                  variant="default"
                  size="xs"
                  onClick={() => {
                    setOverdueFilter(false);
                    setSortBy("newest");
                  }}
                  className="f-hm text-sm text-white hover:opacity-80 cursor-pointer rounded-sm bg-red-600 px-2 py-1 h-full aspect-square"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="xs"
                  onClick={() => {
                    setDueSoonFilter(false);
                    setOverdueFilter(true);
                    setSortBy("overdue");
                    // Clear other filters to show all overdue clients
                    setSearchTerm("");
                    setStatusFilter("all");
                    setCoachFilter("all");
                    setPackageFilter("all");
                  }}
                  className="f-hm text-sm text-white hover:opacity-80 cursor-pointer rounded-sm bg-red-600 px-2 py-1 h-full aspect-square"
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Notice period warnings - only show if there are clients due soon (excluding overdue) */}
        {clients.filter(isClientDueSoonOnly).length > 0 && (
          <div className="flex gap-2">
            <div className="text-sm bg-orange-50 border border-l-4 border-orange-300 rounded-sm px-2.5 py-1.5 flex items-center justify-between w-fit gap-4">
              <div className="flex gap-1 items-center">
                <span className="f-hm">
                  {clients.filter(isClientDueSoonOnly).length}
                </span>
                <span>
                  clients are due within the next{" "}
                  <span className="f-hm">
                    {settings.noticePeriodWeeks} weeks
                  </span>
                </span>
              </div>
            </div>

            <div>
              {dueSoonFilter ? (
                <Button
                  variant="default"
                  size="xs"
                  onClick={() => {
                    setDueSoonFilter(false);
                    setSortBy("newest");
                  }}
                  className="f-hm text-sm text-white hover:opacity-80 cursor-pointer rounded-sm bg-orange-600 px-2 py-1 h-full aspect-square"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="xs"
                  onClick={() => {
                    setDueSoonFilter(true);
                    setOverdueFilter(false);
                    setSortBy("due-soon");
                    // Clear other filters to show all overdue clients
                    setSearchTerm("");
                    setStatusFilter("all");
                    setCoachFilter("all");
                    setPackageFilter("all");
                  }}
                  className="f-hm text-sm text-white hover:opacity-80 cursor-pointer rounded-sm bg-orange-600 px-2 py-1 h-full aspect-square"
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 rounded-sm"
          />
        </div>

        <div className="relative flex flex-wrap gap-2">
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
              {coaches.map((coach, index) => (
                <SelectItem
                  key={`filter-coach-${coach._id}-${index}`}
                  value={coach._id}
                >
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
                <SelectItem key={`filter-package-${pkg}-${index}`} value={pkg}>
                  {pkg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(
              value: "newest" | "oldest" | "due-soon" | "overdue"
            ) => setSortBy(value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="due-soon">Due Soon</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <div className="absolute top-11 right-0">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800 bg-transparent border-none"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filteredClients.length} of {clients.length} clients
      </div>

      {/* Table */}
      <div className={`rounded-sm border ${isCompact ? "" : "border-2"}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className={`border-l f-hm w-[180px] ${cellPadding}`}>
                Client
              </TableHead>
              <TableHead className={`border-l f-hm w-[150px] ${cellPadding}`}>
                Coach
              </TableHead>
              {settings.clientFormFields.startDate && (
                <TableHead className={`border-l f-hm w-[200px] ${cellPadding}`}>
                  Start Date
                </TableHead>
              )}
              <TableHead className={`border-l f-hm w-[200px] ${cellPadding}`}>
                Training Package
              </TableHead>
              <TableHead className={`border-l f-hm w-[200px] ${cellPadding}`}>
                Package End Date
              </TableHead>
              {settings.clientFormFields.progressCallDate && (
                <TableHead className={`border-l f-hm w-[200px] ${cellPadding}`}>
                  Next Progress Call
                </TableHead>
              )}
              {settings.clientFormFields.planUpdateDate && (
                <TableHead className={`border-l f-hm w-[200px] ${cellPadding}`}>
                  Next Plan Update
                </TableHead>
              )}
              {settings.clientFormFields.renewalCallDate && (
                <TableHead className={`border-l f-hm w-[200px] ${cellPadding}`}>
                  Renewal Call
                </TableHead>
              )}
              {settings.clientFormFields.status && (
                <TableHead className={`border-l f-hm w-[100px] ${cellPadding}`}>
                  Status
                </TableHead>
              )}

              {/* Additional fields from settings */}
              {settings.clientFormFields.phone && (
                <TableHead className={`border-l f-hm w-[140px] ${cellPadding}`}>
                  Phone
                </TableHead>
              )}
              {settings.clientFormFields.paymentDate && (
                <TableHead className={`border-l f-hm w-[140px] ${cellPadding}`}>
                  Payment Date
                </TableHead>
              )}
              {settings.clientFormFields.age && (
                <TableHead className={`border-l f-hm w-[80px] ${cellPadding}`}>
                  Age
                </TableHead>
              )}
              {settings.clientFormFields.gender && (
                <TableHead className={`border-l f-hm w-[100px] ${cellPadding}`}>
                  Gender
                </TableHead>
              )}
              {settings.clientFormFields.currentWeight && (
                <TableHead className={`border-l f-hm w-[120px] ${cellPadding}`}>
                  Current Weight
                </TableHead>
              )}
              {settings.clientFormFields.targetWeight && (
                <TableHead className={`border-l f-hm w-[120px] ${cellPadding}`}>
                  Target Weight
                </TableHead>
              )}
              {settings.clientFormFields.height && (
                <TableHead className={`border-l f-hm w-[100px] ${cellPadding}`}>
                  Height
                </TableHead>
              )}
              {settings.clientFormFields.membershipType && (
                <TableHead className={`border-l f-hm w-[150px] ${cellPadding}`}>
                  Membership Type
                </TableHead>
              )}

              {/* Notes always comes last before actions */}
              {settings.clientFormFields.notes && (
                <TableHead className={`border-l f-hm w-[300px] ${cellPadding}`}>
                  Notes
                </TableHead>
              )}
              <TableHead className="border-l w-[80px]">
                <div className="flex items-center justify-between">
                  <span className="f-hm">Actions</span>
                  <div className="relative inline-flex group">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleTableViewToggle}
                      disabled={isLoadingPreferences}
                      className="h-6 w-6 p-0 ml-2"
                    >
                      {tableView === "compact" ? (
                        <Maximize2 className="h-4 w-4" />
                      ) : (
                        <Minimize2 className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap pointer-events-none z-10">
                      {tableView === "compact"
                        ? "Relaxed table view"
                        : "Compact table view"}
                    </div>
                  </div>
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
                  if (settings.clientFormFields.phone) columnCount++;
                  if (settings.clientFormFields.paymentDate) columnCount++;
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
                        className={`${isEvenRow ? "bg-white" : "bg-[#F9FAFC]"}`}
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

                        <TableCell className={`border-l ${cellPadding}`}>
                          <div className="f-hm">{client.name}</div>
                          {settings.clientFormFields.email && (
                            <div
                              className={`text-gray-500 ${
                                isCompact ? "mt-0" : "mt-0.5"
                              }`}
                            >
                              {client.email || "No email"}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className={`border-l ${cellPadding}`}>
                          {client.assignedCoach && client.assignedCoach.name
                            ? client.assignedCoach.name
                            : "Unassigned"}
                        </TableCell>

                        {settings.clientFormFields.startDate && (
                          <TableCell className={`border-l ${cellPadding}`}>
                            {formatDateDisplay(new Date(client.startDate))}
                          </TableCell>
                        )}

                        <TableCell className={`border-l ${cellPadding}`}>
                          {pkg ? (
                            <Tag
                              label={client.selectedPackage}
                              bgColour={pkg.packageColor || "bg-blue-100"}
                              textColour={
                                pkg.packageColor
                                  ? "text-white"
                                  : "text-blue-800"
                              }
                              size="small"
                              isCompact={false}
                            />
                          ) : (
                            <Tag
                              label="No package assigned"
                              bgColour="bg-gray-100"
                              textColour="text-gray-600"
                              size="small"
                              isCompact={false}
                            />
                          )}
                        </TableCell>

                        <TableCell className={`border-l ${cellPadding}`}>
                          {dates && dates.packageEndDate ? (
                            <div className="text-gray-700">
                              {formatDateDisplay(dates.packageEndDate)}
                            </div>
                          ) : pkg?.isRecurring ? (
                            <span className="text-gray-400">
                              N/A (Recurring)
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>

                        {settings.clientFormFields.progressCallDate && (
                          <TableCell className={`border-l ${cellPadding}`}>
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
                            {!dates && (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                        )}

                        {settings.clientFormFields.planUpdateDate && (
                          <TableCell className={`border-l ${cellPadding}`}>
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
                            {!dates && (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                        )}

                        {settings.clientFormFields.renewalCallDate && (
                          <TableCell className={`border-l ${cellPadding}`}>
                            {pkg?.isRecurring ? (
                              <span className="text-gray-400">
                                N/A (Recurring)
                              </span>
                            ) : dates && dates.renewalCallDate ? (
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
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                        )}

                        {settings.clientFormFields.status && (
                          <TableCell className={`border-l ${cellPadding}`}>
                            <Tag
                              label={client.status}
                              icon={
                                client.status === "active"
                                  ? "active"
                                  : client.status === "paused"
                                  ? "paused"
                                  : "inactive"
                              }
                              bgColour={
                                client.status === "active"
                                  ? "bg-green-100"
                                  : client.status === "paused"
                                  ? "bg-yellow-100"
                                  : "bg-red-100"
                              }
                              textColour={
                                client.status === "active"
                                  ? "text-green-800"
                                  : client.status === "paused"
                                  ? "text-yellow-800"
                                  : "text-red-800"
                              }
                              size="small"
                              isCompact={isCompact}
                            />
                          </TableCell>
                        )}

                        {/* Additional fields from settings */}
                        {settings.clientFormFields.phone && (
                          <TableCell className={`border-l ${cellPadding}`}>
                            {client.phone || "-"}
                          </TableCell>
                        )}
                        {settings.clientFormFields.paymentDate && (
                          <TableCell className={`border-l ${cellPadding}`}>
                            {client.paymentDate ? (
                              formatDateDisplay(new Date(client.paymentDate))
                            ) : (
                              <span className="text-gray-500">
                                Not yet paid
                              </span>
                            )}
                          </TableCell>
                        )}
                        {settings.clientFormFields.age && (
                          <TableCell className={`border-l ${cellPadding}`}>
                            {client.age || "-"}
                          </TableCell>
                        )}
                        {settings.clientFormFields.gender && (
                          <TableCell className={`border-l ${cellPadding}`}>
                            {client.gender || "-"}
                          </TableCell>
                        )}
                        {settings.clientFormFields.currentWeight && (
                          <TableCell className={`border-l ${cellPadding}`}>
                            {client.currentWeight
                              ? `${client.currentWeight} kg`
                              : "-"}
                          </TableCell>
                        )}
                        {settings.clientFormFields.targetWeight && (
                          <TableCell className={`border-l ${cellPadding}`}>
                            {client.targetWeight
                              ? `${client.targetWeight} kg`
                              : "-"}
                          </TableCell>
                        )}
                        {settings.clientFormFields.height && (
                          <TableCell className={`border-l ${cellPadding}`}>
                            {client.height ? `${client.height} cm` : "-"}
                          </TableCell>
                        )}
                        {settings.clientFormFields.membershipType && (
                          <TableCell className={`border-l ${cellPadding}`}>
                            {client.membershipType || "-"}
                          </TableCell>
                        )}

                        {/* Notes always comes last before actions */}
                        {settings.clientFormFields.notes && (
                          <TableCell className={`border-l ${cellPadding}`}>
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

                        <TableCell className={`border-l ${cellPadding}`}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel className="f-hm">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleEditClient(client)}
                              >
                                <Edit className="h-4 w-4" />
                                Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />

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
                                <Trash2 className="h-4 w-4" />
                                Delete Client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* Expanded content */}
                      {isExpanded && (
                        <TableRow
                          className={`${isEvenRow ? "bg-white" : "bg-gray-50"}`}
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
