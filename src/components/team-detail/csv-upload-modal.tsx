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
  Download,
  Users,
  Settings,
  UserCheck,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { AddPackageModal } from "./add-package-modal";
import type { TeamSettings } from "@/types";
import { CSVStepCard } from "./csv-step-card";
import Link from "next/link";

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

      // Check for duplicates immediately after upload
      checkDuplicatesFromCSV(rows, headers);
    };
    reader.readAsText(file);
  };

  const checkDuplicatesFromCSV = async (rows: CSVRow[], headers: string[]) => {
    try {
      // Find email columns
      const emailColumns = headers.filter((header) =>
        header.toLowerCase().includes("email")
      );

      if (emailColumns.length === 0) {
        // No email columns found, skip duplicate check
        setDuplicates([]);
        setCurrentStep(4); // Go directly to mapping
        return;
      }

      // Extract emails from CSV
      const emails: string[] = [];
      rows.forEach((row) => {
        emailColumns.forEach((emailCol) => {
          const email = row[emailCol]?.trim().toLowerCase();
          if (email && email.includes("@")) {
            emails.push(email);
          }
        });
      });

      if (emails.length === 0) {
        // No valid emails found, skip duplicate check
        setDuplicates([]);
        setCurrentStep(4); // Go directly to mapping
        return;
      }

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

        // Find which rows have duplicate emails
        rows.forEach((row, index) => {
          emailColumns.forEach((emailCol) => {
            const email = row[emailCol]?.trim().toLowerCase();
            if (email && duplicateEmails.has(email)) {
              const existingClient = data.duplicates.find(
                (d: any) => d.email === email
              );
              duplicateInfo.push({
                email,
                existingClientName: existingClient.clientName,
                csvRowIndex: index,
              });
            }
          });
        });

        setDuplicates(duplicateInfo);
        setCurrentStep(3); // Go to duplicate review
      }
    } catch (error) {
      console.error("Error checking duplicates:", error);
      toast.error("Failed to check for duplicates");
      setCurrentStep(4); // Continue to mapping on error
    }
  };

  const handleDuplicatesReview = () => {
    setCurrentStep(4); // Go to mapping
  };

  const handleMappingComplete = async () => {
    console.log("Processing mapping with:", fieldMapping);

    // Map CSV data to client objects, excluding duplicates
    const duplicateRowIndices = new Set(duplicates.map((d) => d.csvRowIndex));

    const mapped: MappedClient[] = csvData
      .map((row, index) => {
        // Skip duplicate rows
        if (duplicateRowIndices.has(index)) {
          return null;
        }

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
      .filter(
        (client): client is MappedClient => client !== null && client.name
      ); // Only include clients with names

    console.log("Mapped clients:", mapped);
    setNonDuplicateClients(mapped);
    setCurrentStep(5); // Go to assignment
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

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return null;
      case 2:
        return "Upload CSV File";
      case 3:
        return "Reviewing Uploaded CSV";
      case 4:
        return "Map CSV to App";
      case 5:
        return "Assign Coach & Package";
      default:
        return "Upload Clients";
    }
  };

  // Calculate progress step (only count the 3 main action steps)
  const getProgressStep = () => {
    if (currentStep === 1) return 0; // Overview - no progress
    if (currentStep === 2) return 1; // Upload
    if (currentStep === 3) return 1; // Duplicates review - same as upload step
    if (currentStep === 4) return 2; // Map
    if (currentStep === 5) return 3; // Assign
    return 0;
  };

  const progressStep = getProgressStep();

  // Auto-map fields when we reach the mapping step
  const autoMapFields = () => {
    const autoMapping: { [key: string]: string } = {};
    csvHeaders.forEach((header) => {
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
  };

  // Auto-map when we reach step 4 (mapping)
  if (currentStep === 4 && Object.keys(fieldMapping).length === 0) {
    autoMapFields();
  }

  // Helper function to generate example CSV
  const generateExampleCSV = () => {
    const csvContent = `Name,Email,Phone,Age,Gender,Start Date,Current Weight,Target Weight,Height,Notes
  John Smith,john.smith@email.com,555-0123,28,Male,2024-01-15,180,165,5'10",Wants to lose weight for wedding
  Sarah Johnson,sarah.j@email.com,555-0456,32,Female,2024-01-20,140,130,5'6",Marathon training goal
  Mike Davis,mike.davis@email.com,555-0789,45,Male,2024-01-25,200,175,6'0",Doctor recommended fitness program`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "example-clients.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getStepTitle()}
            </DialogTitle>

            {progressStep > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-blk-60">
                  Step {progressStep} of 3
                </span>

                <div className="flex-1 bg-gray-200 rounded-xs h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-xs transition-all duration-300"
                    style={{ width: `${(progressStep / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </DialogHeader>

          {/* Step 1: Overview */}
          {currentStep === 1 && (
            <>
              {/* Overview Title */}
              <div className="mt-6 mb-6 text-center">
                <h3 className="text-lg leading-none f-hr">
                  Upload your clients in 3 simple steps
                </h3>

                <p className="text-sm text-blk-60 mt-1">
                  We'll guide you through each step to make it easy
                </p>
              </div>

              {/* Overview Cards */}
              <div className="flex gap-4">
                <CSVStepCard
                  title="Upload CSV File"
                  description="Upload your CSV file of clients. We'll automatically check for duplicates to save you time."
                  hasButton
                  stepCount={1}
                />

                <CSVStepCard
                  title="Map CSV to App"
                  description="Tell us which columns in your CSV match which fields in our app. We'll auto-detect most of them for you."
                  stepCount={2}
                />

                <CSVStepCard
                  title="Assign Coaches & Training Packages"
                  description="Choose which coach and training package to assign to each client. You can assign them individually or in bulk."
                  stepCount={3}
                />
              </div>

              {/* Notice Tip + Get Started Button */}
              <div className="flex justify-between items-end mt-4">
                <div className="text-xs max-w-2/3">
                  <div className="flex items-center gap-0.5 mb-1">
                    <FileText className="size-3" />
                    <p className="f-hm">Tip</p>
                  </div>

                  <div>
                    Your CSV should have column headers in the first row. Common
                    columns include: Name, Email, Phone, Age, Gender, Start
                    Date, Current Weight, Target Weight, Height, Notes.
                    <div
                      onClick={generateExampleCSV}
                      className="underline ml-1 inline-block text-blue-600 text-xs cursor-pointer hover:opacity-60 transition-all duration-200 ease-in"
                    >
                      Download Example CSV
                    </div>
                  </div>
                </div>

                <Button
                  size="md"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2"
                >
                  Get Started
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Upload */}
          {currentStep === 2 && (
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-sm px-12 py-20 text-center hover:border-blue-400 transition-colors bg-[#F9FAFC]">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} size="lg">
                  Choose CSV File
                </Button>

                <p className="text-xs text-blk-60 mt-2">
                  Only CSV files are supported
                </p>
              </div>

              <div className="text-xs">
                <div className="flex items-center gap-0.5 mb-1">
                  <FileText className="size-3" />
                  <p className="f-hm">Need help?</p>
                </div>
                <div
                  onClick={generateExampleCSV}
                  className="underline mr-1 inline-block text-blue-600 text-xs cursor-pointer hover:opacity-60 transition-all duration-200 ease-in"
                >
                  Download Example CSV
                </div>
                for the correct format.
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Duplicates Found */}
          {currentStep === 3 && (
            <>
              {duplicates.length > 0 ? (
                <>
                  {/* List of duplicates found */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {/* Notice of duplicates */}
                    <div className="p-4 border rounded-sm bg-[#F9FAFC]">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="size-4 text-yellow-600" />
                        <div>
                          <p className="text-sm">
                            We found{" "}
                            <span className="f-hm">{duplicates.length}</span>{" "}
                            duplicate{" "}
                            {duplicates.length > 1 ? "emails" : "email"} in your
                            CSV file
                          </p>
                          <p className="text-xs text-blk-60">
                            These clients already exist and will be skipped
                            during import.
                          </p>
                        </div>
                      </div>
                    </div>

                    {duplicates.map((duplicate, index) => (
                      <div
                        key={index}
                        className="p-4 bg-yellow-50 border border-yellow-200 rounded-sm"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="size-4 text-yellow-600" />
                          <div>
                            <p className="text-sm">{duplicate.email}</p>
                            <p className="text-xs text-blk-60">
                              Matches existing client:{" "}
                              {duplicate.existingClientName}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notice of non-duplicates */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-sm">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-green-600" />
                      <div>
                        <p className="text-sm">
                          {csvData.length - duplicates.length} clients ready to
                          import
                        </p>
                        <p className="text-xs text-blk-60">
                          These clients will proceed to the mapping step
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Great! No duplicates found. All{" "}
                    <strong>{csvData.length}</strong> clients will proceed to
                    the mapping step.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                {csvData.length - duplicates.length > 0 && (
                  <Button
                    size="md"
                    onClick={handleDuplicatesReview}
                    className="flex items-center gap-2"
                  >
                    Continue to Mapping
                    <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Step 4: Map Columns */}
          {currentStep === 4 && (
            <>
              {/* Notice of duplicates */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-green-600" />
                  <div>
                    <p className="text-sm">
                      Great! We found{" "}
                      <span className="f-hm">{csvHeaders.length} columns</span>{" "}
                      and{" "}
                      <span className="f-hm">
                        {csvData.length - duplicates.length} clients
                      </span>{" "}
                      to import from your CSV
                    </p>
                    <p className="text-xs text-blk-60">
                      We've automatically mapped most fields for you but be sure
                      to review and adjust if needed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Column Headers */}
                <div className="flex justify-between items-center relative">
                  <p className="w-1/2 text-xs text-blk-60">
                    Columns found in CSV
                  </p>

                  <p className="w-1/2 text-xs text-blk-60">
                    Map to value in app
                    <span className="text-red-600 text-[8px]">tooltip</span>
                  </p>

                  <Link
                    href="/bolt-ons"
                    target="_blank"
                    className="absolute right-0 top-0 text-right text-xs text-blk-60 underline tracking-wide hover:opacity-40"
                  >
                    Need a custom mapping field?
                  </Link>
                </div>

                {/* Data to be mapped */}
                {csvHeaders.map((header, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 border rounded-sm"
                  >
                    {/* CSV Headers */}
                    <div className="w-1/2 flex justify-between items-center">
                      <div>
                        <label className="text-sm">{header}</label>

                        <p className="text-xs text-blk-60 truncate">
                          Sample: {csvData[0]?.[header] || "N/A"}
                        </p>
                      </div>

                      <ArrowRight className="h-4 w-4 text-gray-400 mr-4" />
                    </div>

                    {/* App Fields */}
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
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <span className="f-hm">Tip:</span> Multiple columns can be
                  mapped to "Client Name" (like First Name + Last Name) and will
                  be automatically combined. Set columns you don't need to
                  "Don't import this column".
                </AlertDescription>
              </Alert> */}

              <div className="flex justify-between pt-4">
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => setCurrentStep(duplicates.length > 0 ? 3 : 2)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>

                <Button
                  size="md"
                  onClick={handleMappingComplete}
                  className="flex items-center gap-2"
                >
                  Continue to Assignment
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 5: Assign Coaches & Packages */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Assign Coach & Training Package
                </h3>
                <p className="text-gray-600">
                  Choose which coach and training package to assign to each
                  client
                </p>
              </div>

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
                  <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
                            <tr key={index} className="hover:bg-gray-50">
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

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(4)}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={!canProceedToImport || isImporting}
                      size="lg"
                    >
                      {isImporting
                        ? "Importing..."
                        : `Import ${nonDuplicateClients.length} Clients`}
                    </Button>
                  </div>
                </>
              )}
            </div>
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
