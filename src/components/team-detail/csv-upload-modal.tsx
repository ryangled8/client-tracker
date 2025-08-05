"use client";

import type React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { AddPackageModal } from "./add-package-modal";
import type { TeamSettings } from "@/types";

interface Coach {
  _id: string;
  name: string;
  email: string;
}

interface Package {
  packageName: string;
  packageDuration: number;
  planProgressCall: number;
  planRenewalCall: number;
  planUpdateWeek: number;
  packageColor?: string;
  isActive: boolean;
  isRecurring: boolean;
  createdAt: string;
}

interface CSVUploadModalProps {
  teamId: string;
  coaches: Coach[];
  packages: Package[];
  settings: TeamSettings;
  onClientsImported: () => void;
}

interface CSVRow {
  [key: string]: string;
}

interface MappedClient {
  originalIndex: number;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  assignedCoach?: string;
  selectedPackage?: string;
  startDate?: string;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
  status?: string;
  membershipType?: string;
  notes?: string;
  paymentDate?: string;
}

interface DuplicateInfo {
  email: string;
  existingClientName: string;
  csvRowIndex: number;
}

const FIELD_MAPPING_OPTIONS = [
  { value: "name", label: "Client Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "age", label: "Age" },
  { value: "gender", label: "Gender" },
  { value: "startDate", label: "Start Date" },
  { value: "currentWeight", label: "Current Weight" },
  { value: "targetWeight", label: "Target Weight" },
  { value: "height", label: "Height" },
  { value: "status", label: "Status" },
  { value: "membershipType", label: "Membership Type" },
  { value: "notes", label: "Notes" },
  { value: "paymentDate", label: "Payment Date" },
  { value: "skip", label: "Don't import this column" },
];

// Helper function to parse CSV more reliably
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = "";
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current.trim());
  return result;
};

// Helper function to validate and format date
const parseDate = (dateStr: string): string | undefined => {
  if (!dateStr || dateStr.trim() === "") return undefined;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return undefined;
    return date.toISOString();
  } catch {
    return undefined;
  }
};

// Helper function to validate gender
const parseGender = (genderStr: string): string | undefined => {
  if (!genderStr || genderStr.trim() === "") return undefined;

  const gender = genderStr.toLowerCase().trim();
  const validGenders = ["male", "female", "other", "prefer-not-to-say"];

  if (validGenders.includes(gender)) {
    return gender;
  }

  // Try to match common variations
  if (gender === "m" || gender === "man") return "male";
  if (gender === "f" || gender === "woman") return "female";
  if (gender === "prefer not to say" || gender === "no answer")
    return "prefer-not-to-say";

  return undefined;
};

export const CSVUploadModal: React.FC<CSVUploadModalProps> = ({
  teamId,
  coaches,
  packages,
  settings,
  onClientsImported,
}) => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<{ [key: string]: string }>(
    {}
  );
  const [mappedClients, setMappedClients] = useState<MappedClient[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [nonDuplicateClients, setNonDuplicateClients] = useState<
    MappedClient[]
  >([]);
  const [selectedClients, setSelectedClients] = useState<Set<number>>(
    new Set()
  );
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [currentPackages, setCurrentPackages] = useState(packages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = () => {
    setCurrentStep(1);
    setCsvData([]);
    setCsvHeaders([]);
    setFieldMapping({});
    setMappedClients([]);
    setDuplicates([]);
    setNonDuplicateClients([]);
    setSelectedClients(new Set());
    setIsImporting(false);
    setImportProgress(0);
    setCurrentPackages(packages);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        toast.error(
          "CSV file must have at least a header row and one data row"
        );
        return;
      }

      // Parse headers more reliably
      const headers = parseCSVLine(lines[0]).map((h) =>
        h.replace(/"/g, "").trim()
      );

      // Parse data rows more reliably
      const rows = lines.slice(1).map((line) => {
        const values = parseCSVLine(line).map((v) =>
          v.replace(/"/g, "").trim()
        );
        const row: CSVRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        return row;
      });

      console.log("Parsed CSV headers:", headers);
      console.log("Sample CSV row:", rows[0]);

      setCsvHeaders(headers);
      setCsvData(rows);

      // Auto-map common fields - map name variations to "name"
      const autoMapping: { [key: string]: string } = {};
      headers.forEach((header) => {
        const lowerHeader = header.toLowerCase().trim();

        // Map all name variations to "name" field
        if (
          lowerHeader.includes("name") ||
          lowerHeader.includes("first") ||
          lowerHeader.includes("last") ||
          lowerHeader.includes("surname") ||
          lowerHeader === "client"
        ) {
          autoMapping[header] = "name";
        } else if (lowerHeader.includes("email")) {
          autoMapping[header] = "email";
        } else if (lowerHeader.includes("phone")) {
          autoMapping[header] = "phone";
        } else if (lowerHeader.includes("age")) {
          autoMapping[header] = "age";
        } else if (
          lowerHeader.includes("gender") ||
          lowerHeader.includes("sex")
        ) {
          autoMapping[header] = "gender";
        } else if (
          (lowerHeader.includes("start") && lowerHeader.includes("date")) ||
          (lowerHeader.includes("program") && lowerHeader.includes("start")) ||
          (lowerHeader.includes("package") && lowerHeader.includes("start")) ||
          (lowerHeader.includes("training") && lowerHeader.includes("start"))
        ) {
          // Only map fields that are clearly about when training/package started
          autoMapping[header] = "startDate";
        } else if (
          lowerHeader.includes("weight") &&
          lowerHeader.includes("current")
        ) {
          autoMapping[header] = "currentWeight";
        } else if (
          lowerHeader.includes("weight") &&
          lowerHeader.includes("target")
        ) {
          autoMapping[header] = "targetWeight";
        } else if (lowerHeader.includes("height")) {
          autoMapping[header] = "height";
        } else if (lowerHeader.includes("status")) {
          autoMapping[header] = "status";
        } else if (lowerHeader.includes("membership")) {
          autoMapping[header] = "membershipType";
        } else if (lowerHeader.includes("notes")) {
          autoMapping[header] = "notes";
        } else if (lowerHeader.includes("payment")) {
          autoMapping[header] = "paymentDate";
        } else {
          autoMapping[header] = "skip";
        }
      });

      console.log("Auto-mapping:", autoMapping);
      setFieldMapping(autoMapping);
      setCurrentStep(2);
    };
    reader.readAsText(file);
  };

  const handleMappingComplete = async () => {
    console.log("Processing mapping with:", fieldMapping);

    // Map CSV data to client objects
    const mapped: MappedClient[] = csvData
      .map((row, index) => {
        const client: MappedClient = { originalIndex: index, name: "" };

        // Collect all name parts from columns mapped to "name"
        const nameParts: string[] = [];

        Object.entries(fieldMapping).forEach(([csvHeader, fieldName]) => {
          const value = row[csvHeader];

          if (fieldName === "name" && value) {
            const trimmedValue = value.trim();
            if (trimmedValue) {
              nameParts.push(trimmedValue);
            }
          } else if (fieldName !== "skip" && fieldName !== "name" && value) {
            switch (fieldName) {
              case "age":
              case "currentWeight":
              case "targetWeight":
              case "height":
                const numValue = Number.parseFloat(value);
                if (!isNaN(numValue) && numValue > 0) {
                  (client as any)[fieldName] = numValue;
                }
                break;
              case "gender":
                const parsedGender = parseGender(value);
                if (parsedGender) {
                  client.gender = parsedGender;
                }
                break;
              case "startDate":
              case "paymentDate":
                const parsedDate = parseDate(value);
                if (parsedDate) {
                  (client as any)[fieldName] = parsedDate;
                }
                break;
              case "email":
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(value.trim())) {
                  client.email = value.trim().toLowerCase();
                }
                break;
              case "phone":
                // Clean phone number
                const cleanPhone = value.replace(/[^\d+\-\s()]/g, "").trim();
                if (cleanPhone) {
                  client.phone = cleanPhone;
                }
                break;
              case "status":
                const status = value.toLowerCase().trim();
                if (["active", "inactive", "paused"].includes(status)) {
                  client.status = status as "active" | "inactive" | "paused";
                }
                break;
              default:
                // For other string fields
                const trimmedValue = value.trim();
                if (trimmedValue) {
                  (client as any)[fieldName] = trimmedValue;
                }
            }
          }
        });

        // Merge all name parts into a single name
        if (nameParts.length > 0) {
          client.name = nameParts.join(" ");
        }

        console.log(`Processed client ${index}:`, client);
        return client;
      })
      .filter((client) => client.name); // Only include clients with names

    console.log("Mapped clients:", mapped);
    setMappedClients(mapped);

    // Check for duplicates
    if (mapped.some((client) => client.email)) {
      await checkDuplicates(mapped);
    } else {
      setDuplicates([]);
      setNonDuplicateClients(mapped);
      setCurrentStep(4);
    }
  };

  const checkDuplicates = async (clients: MappedClient[]) => {
    try {
      const emails = clients.filter((c) => c.email).map((c) => c.email);
      const response = await fetch("/api/clients/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, emails }),
      });

      const data = await response.json();
      if (response.ok) {
        const duplicateEmails = new Set(
          data.duplicates.map((d: any) => d.email)
        );
        const duplicateInfo: DuplicateInfo[] = [];
        const nonDuplicates: MappedClient[] = [];

        clients.forEach((client) => {
          if (client.email && duplicateEmails.has(client.email)) {
            const existingClient = data.duplicates.find(
              (d: any) => d.email === client.email
            );
            duplicateInfo.push({
              email: client.email,
              existingClientName: existingClient.clientName,
              csvRowIndex: client.originalIndex,
            });
          } else {
            nonDuplicates.push(client);
          }
        });

        setDuplicates(duplicateInfo);
        setNonDuplicateClients(nonDuplicates);
        setCurrentStep(3);
      }
    } catch (error) {
      console.error("Error checking duplicates:", error);
      toast.error("Failed to check for duplicates");
    }
  };

  const handleDuplicatesReview = () => {
    setCurrentStep(4);
  };

  const handleClientAssignment = (
    clientIndex: number,
    field: "assignedCoach" | "selectedPackage",
    value: string
  ) => {
    setNonDuplicateClients((prev) =>
      prev.map((client, index) =>
        index === clientIndex ? { ...client, [field]: value } : client
      )
    );
  };

  const handleBulkAssignment = (
    field: "assignedCoach" | "selectedPackage",
    value: string
  ) => {
    setNonDuplicateClients((prev) =>
      prev.map((client, index) =>
        selectedClients.has(index) ? { ...client, [field]: value } : client
      )
    );
  };

  const toggleClientSelection = (index: number) => {
    setSelectedClients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const selectAllClients = () => {
    if (selectedClients.size === nonDuplicateClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(nonDuplicateClients.map((_, index) => index)));
    }
  };

  const canProceedToImport = nonDuplicateClients.every(
    (client) => client.assignedCoach && client.selectedPackage
  );

  const handleImport = async () => {
    if (!canProceedToImport) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const clientsToImport = nonDuplicateClients.map((client) => {
        const clientData = {
          name: client.name,
          email: client.email || undefined,
          phone: client.phone || undefined,
          age: client.age,
          gender: client.gender || undefined,
          assignedCoach: client.assignedCoach!,
          selectedPackage: client.selectedPackage!,
          startDate: client.startDate || new Date().toISOString(),
          currentWeight: client.currentWeight,
          targetWeight: client.targetWeight,
          height: client.height,
          status: client.status || "active",
          membershipType: client.membershipType || undefined,
          notes: client.notes || undefined,
          paymentDate: client.paymentDate || undefined,
          team: teamId,
        };

        console.log("Client data to import:", clientData);
        return clientData;
      });

      for (let i = 0; i < clientsToImport.length; i++) {
        const client = clientsToImport[i];

        const response = await fetch("/api/clients/add-client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(client),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Failed to import client ${client.name}:`, error);
          throw new Error(
            `Failed to import client ${client.name}: ${
              error.error || "Unknown error"
            }`
          );
        }

        setImportProgress(((i + 1) / clientsToImport.length) * 100);
      }

      toast.success(`Successfully imported ${clientsToImport.length} clients`);
      onClientsImported();
      setOpen(false);
      resetModal();
    } catch (error) {
      console.error("Import error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to import clients"
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handlePackageCreated = () => {
    setCurrentPackages([...currentPackages]);
    setShowPackageModal(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) resetModal();
        }}
      >
        <DialogTrigger asChild>
          <Button size="lg">
            <Plus className="h-4 w-4" />
            Upload via CSV
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          {/* Step 1: Upload */}
          {currentStep === 1 && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload CSV File
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Upload a CSV file with client data. The first row should
                    contain column headers. Common columns include: Name, Email,
                    Phone, Age, Gender, Start Date, etc. Name fields (First
                    Name, Last Name, etc.) will be automatically merged into
                    Client Name.
                  </AlertDescription>
                </Alert>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose CSV File
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Only CSV files are supported
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Map Columns */}
          {currentStep === 2 && (
            <>
              <DialogHeader>
                <DialogTitle>Map CSV Columns</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Map each CSV column to the corresponding field in your system.
                  Multiple columns can be mapped to "Client Name" and will be
                  merged together:
                </p>

                <div className="space-y-3">
                  {csvHeaders.map((header, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-1/3">
                        <label className="text-sm font-medium">{header}</label>
                        <p className="text-xs text-gray-500">
                          Sample: {csvData[0]?.[header] || "N/A"}
                        </p>
                      </div>
                      <div className="w-2/3">
                        <Select
                          value={fieldMapping[header] || "skip"}
                          onValueChange={(value) =>
                            setFieldMapping((prev) => ({
                              ...prev,
                              [header]: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_MAPPING_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Tip:</strong> Map First Name, Last Name, Surname, or
                    any name columns to "Client Name". They will be
                    automatically combined into a single name field.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button onClick={handleMappingComplete}>Continue</Button>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Duplicates Found */}
          {currentStep === 3 && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Duplicates Found
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {duplicates.length > 0 ? (
                  <>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Found {duplicates.length} duplicate email(s). These
                        clients already exist and will be skipped.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      {duplicates.map((duplicate, index) => (
                        <div
                          key={index}
                          className="p-3 bg-yellow-50 rounded border"
                        >
                          <p className="text-sm">
                            <strong>Email:</strong> {duplicate.email}
                            <span className="text-gray-600 ml-2">
                              (matches existing client:{" "}
                              {duplicate.existingClientName})
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      No duplicates found. All clients will proceed to the next
                      step.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="p-4 bg-green-50 rounded border">
                  <p className="text-sm">
                    <strong>{nonDuplicateClients.length}</strong> clients will
                    proceed to assignment step.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button onClick={handleDuplicatesReview}>Continue</Button>
                </div>
              </div>
            </>
          )}

          {/* Step 4: Assign Coaches & Packages */}
          {currentStep === 4 && (
            <>
              <DialogHeader>
                <DialogTitle>Assign Coaches & Packages</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {nonDuplicateClients.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No clients to import after removing duplicates.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {/* Bulk Assignment Controls */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded">
                      <Checkbox
                        checked={
                          selectedClients.size === nonDuplicateClients.length
                        }
                        onCheckedChange={selectAllClients}
                      />
                      <span className="text-sm font-medium">
                        Select All ({selectedClients.size} selected)
                      </span>

                      {selectedClients.size > 0 && (
                        <>
                          <Select
                            onValueChange={(value) =>
                              handleBulkAssignment("assignedCoach", value)
                            }
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Bulk assign coach" />
                            </SelectTrigger>
                            <SelectContent>
                              {coaches.map((coach, index) => (
                                <SelectItem
                                  key={`bulk-coach-${coach._id}-${index}`}
                                  value={coach._id}
                                >
                                  {coach.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            onValueChange={(value) =>
                              handleBulkAssignment("selectedPackage", value)
                            }
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Bulk assign package" />
                            </SelectTrigger>
                            <SelectContent>
                              {currentPackages
                                .filter((pkg) => pkg.isActive)
                                .map((pkg, index) => (
                                  <SelectItem
                                    key={`bulk-package-${pkg.packageName}-${index}`}
                                    value={pkg.packageName}
                                  >
                                    {pkg.packageName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>

                    {/* Add Package Button */}
                    {currentPackages.filter((pkg) => pkg.isActive).length ===
                      0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          No active packages found. You need to create a package
                          first.
                          <Button
                            size="sm"
                            onClick={() => setShowPackageModal(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Package
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Client Assignment Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Select
                              </th>
                              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Client Name
                              </th>
                              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Email
                              </th>
                              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Coach
                              </th>
                              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Package
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {nonDuplicateClients.map((client, index) => (
                              <tr key={index}>
                                <td className="p-3">
                                  <Checkbox
                                    checked={selectedClients.has(index)}
                                    onCheckedChange={() =>
                                      toggleClientSelection(index)
                                    }
                                  />
                                </td>
                                <td className="p-3 text-sm font-medium">
                                  {client.name}
                                </td>
                                <td className="p-3 text-sm text-gray-600">
                                  {client.email || "-"}
                                </td>
                                <td className="p-3">
                                  <Select
                                    value={client.assignedCoach || ""}
                                    onValueChange={(value) =>
                                      handleClientAssignment(
                                        index,
                                        "assignedCoach",
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select coach" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {coaches.map((coach, coachIndex) => (
                                        <SelectItem
                                          key={`client-${index}-coach-${coach._id}-${coachIndex}`}
                                          value={coach._id}
                                        >
                                          {coach.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-3">
                                  <Select
                                    value={client.selectedPackage || ""}
                                    onValueChange={(value) =>
                                      handleClientAssignment(
                                        index,
                                        "selectedPackage",
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select package" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {currentPackages
                                        .filter((pkg) => pkg.isActive)
                                        .map((pkg, pkgIndex) => (
                                          <SelectItem
                                            key={`client-${index}-package-${pkg.packageName}-${pkgIndex}`}
                                            value={pkg.packageName}
                                          >
                                            {pkg.packageName}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Import Progress */}
                    {isImporting && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Importing clients...</span>
                          <span>{Math.round(importProgress)}%</span>
                        </div>
                        <Progress value={importProgress} />
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(3)}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleImport}
                        disabled={!canProceedToImport || isImporting}
                      >
                        {isImporting
                          ? "Importing..."
                          : `Import ${nonDuplicateClients.length} Clients`}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Package Modal */}
      {showPackageModal && (
        <AddPackageModal
          teamId={teamId}
          onPackageCreated={handlePackageCreated}
          onClose={() => setShowPackageModal(false)}
        />
      )}
    </>
  );
};
