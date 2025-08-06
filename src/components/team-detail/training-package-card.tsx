"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Edit,
  Archive,
  ArchiveRestore,
  Trash2,
  Users,
  Clock,
  RefreshCw,
} from "lucide-react";

interface Package {
  packageName: string;
  durationInWeeks: number;
  progressIntervalInWeeks: number;
  planUpdateIntervalInWeeks: number;
  renewalCallWeeksBeforeEnd: number;
  packageColor?: string;
  isActive: boolean;
  isRecurring: boolean;
  createdAt: string;
}

interface TrainingPackageCardProps {
  package: Package;
  packageIndex: number;
  onEdit: (index: number) => void;
  onToggleStatus: (index: number) => void;
  onDelete: (index: number) => void;
}

export function TrainingPackageCard({
  package: pkg,
  packageIndex,
  onEdit,
  onToggleStatus,
  onDelete,
}: TrainingPackageCardProps) {
  return (
    <div className="col-span-1 border rounded-sm p-4 bg-[#F9FAFC]">
      <div className="h-full flex flex-col justify-between">
        <div className="flex justify-between">
          {/* Status Badge */}
          <div>
            <Badge
              variant={pkg.isActive ? "default" : "secondary"}
              className="text-xs rounded-full px-1.5 py-0.5"
            >
              {pkg.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Edit Package */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(packageIndex)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Package
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(packageIndex)}>
                {pkg.isActive ? (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(packageIndex)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Package
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title & Content */}
        <div className="mt-6">
          <h3
            style={{ color: pkg.packageColor || "#3b82f6" }}
            className="text-xl f-hr leading-none"
          >
            {pkg.packageName}
          </h3>

          <div className="text-xs text-blk-60 mt-2">
            {pkg.isRecurring ? (
              <div className="space-y-0.5">
                <p>
                  Progress calls Every
                  <span className="f-hm ml-1">
                    {pkg.progressIntervalInWeeks} weeks
                  </span>
                </p>
                <p>
                  Plan updates Every
                  <span className="f-hm ml-1">
                    {pkg.planUpdateIntervalInWeeks} weeks
                  </span>
                </p>
                <p>
                  Renewal call<span className="f-hm ml-1">N/A</span>
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p>
                  Progress calls every
                  <span className="f-hm ml-1">
                    {pkg.progressIntervalInWeeks} weeks
                  </span>
                </p>
                <p>
                  Plan updates every
                  <span className="f-hm ml-1">
                    {pkg.planUpdateIntervalInWeeks} weeks
                  </span>
                </p>
                <p>
                  Renewal call every
                  <span className="f-hm ml-1">
                    {pkg.renewalCallWeeksBeforeEnd} weeks before end
                  </span>
                </p>
              </div>
            )}

            <div className="flex gap-1 items-center mt-4">
              <Clock className="size-3" />
              {!pkg.isRecurring ? (
                <span>{pkg.durationInWeeks} weeks</span>
              ) : (
                <span>Recurring</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: pkg.packageColor || "#3b82f6" }}
          />
          <h3 className="font-medium text-gray-900">{pkg.packageName}</h3>
          <Badge
            variant={pkg.isActive ? "default" : "secondary"}
            className="text-xs"
          >
            {pkg.isActive ? "Active" : "Inactive"}
          </Badge>
          {pkg.isRecurring && (
            <Badge variant="outline" className="text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Recurring
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(packageIndex)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Package
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(packageIndex)}>
              {pkg.isActive ? (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(packageIndex)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Package
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {!pkg.isRecurring ? (
              <span>{pkg.durationInWeeks} weeks</span>
            ) : (
              <span>Recurring</span>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          {pkg.isRecurring ? (
            <div className="space-x-2">
              <span>
                Progress calls every {pkg.progressIntervalInWeeks} weeks
              </span>
              <span>•</span>
              <span>
                Plan updates every {pkg.planUpdateIntervalInWeeks} weeks
              </span>
            </div>
          ) : (
            <div className="space-x-2">
              <span>
                Progress calls every {pkg.progressIntervalInWeeks} weeks{" "}
              </span>
              <span>•</span>
              <span>
                Plan updates every {pkg.planUpdateIntervalInWeeks}
                weeks
              </span>
              <span>•</span>
              <span>
                Renewal call {pkg.renewalCallWeeksBeforeEnd} weeks before end
              </span>
            </div>
          )}
        </div>
      </div> */}
    </div>
  );
}
