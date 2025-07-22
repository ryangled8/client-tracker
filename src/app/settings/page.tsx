"use client";

import type React from "react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import LogoutButton from "@/components/logout-button";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Update Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Delete Account State
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      setIsUpdatingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const response = await fetch("/api/user/update-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setPasswordError(data.error || "Failed to update password");
      }
    } catch (error) {
      setPasswordError("An error occurred. Please try again.");
      console.log(error);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeletingAccount(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: deletePassword,
          confirmText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Account deleted successfully, sign out and redirect
        await signOut({
          callbackUrl: "/login?message=Account deleted successfully",
        });
      } else {
        setDeleteError(data.error || "Failed to delete account");
      }
    } catch (error) {
      setDeleteError("An error occurred. Please try again.");
      console.log(error);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Account Settings
          </h1>

          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Account Information
            </h2>
            <p className="text-gray-600">Name: {user.name}</p>
            <p className="text-gray-600">Email: {user.email}</p>

            <div className="mt-4">
              <LogoutButton />
            </div>
          </div>

          {/* Update Password Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Update Password
            </h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmNewPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>

              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                  {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {passwordError}
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Delete Account Section */}
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold text-red-900 mb-4">
              Danger Zone
            </h2>

            {!showDeleteConfirm ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 border border-red-300 text-red-700 bg-white hover:bg-red-50 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Delete Account
                </button>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-red-900 font-semibold mb-4">
                  Confirm Account Deletion
                </h3>
                <p className="text-red-700 text-sm mb-4">
                  This action cannot be undone. This will permanently delete
                  your account and remove all associated data.
                </p>

                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  <div>
                    <label
                      htmlFor="deletePassword"
                      className="block text-sm font-medium text-red-700 mb-1"
                    >
                      Enter your password to confirm
                    </label>
                    <input
                      id="deletePassword"
                      type="password"
                      required
                      className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmText"
                      className="block text-sm font-medium text-red-700 mb-1"
                    >
                      Type DELETE to confirm
                    </label>
                    <input
                      id="confirmText"
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                    />
                  </div>

                  {deleteError && (
                    <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm">
                      {deleteError}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletePassword("");
                        setConfirmText("");
                        setDeleteError("");
                      }}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isDeletingAccount || confirmText !== "DELETE"}
                      className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isDeletingAccount ? "Deleting..." : "Delete Account"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors duration-200"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
