"use client";

import { signOut } from "next-auth/react";

interface LogoutButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "outline";
}

export default function LogoutButton({
  className = "",
  variant = "outline",
}: LogoutButtonProps) {
  const baseClasses =
    "inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";

  const variantClasses = {
    primary:
      "border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "border-transparent text-white bg-gray-600 hover:bg-gray-700 focus:ring-gray-500",
    outline:
      "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500",
  };

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      Sign Out
    </button>
  );
}
