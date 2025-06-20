// app.brand.com

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {session.user.name}!
              </h1>
              <p className="text-gray-600">Email: {session.user.email}</p>
              <p className="text-sm text-gray-500">
                User ID: {session.user.id}
              </p>
            </div>
            <LogoutButton />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              🎉 Authentication Setup Complete!
            </h2>
            <p className="text-blue-700">
              You are now logged in and this page is protected by middleware.
              Try logging out and accessing this page again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
