import type React from "react";
import type { Metadata } from "next";
import AuthSessionProvider from "@/components/providers/session-provider";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Navigation from "@/components/custom/navigation/navigation";
import Footer from "@/components/custom/Footer";
// import NavigationServerComponentWrapper from "@/components/custom/navigation/navigation-server-component-wrapper";

export const metadata: Metadata = {
  title: "Client Tracker",
  description: "Online coaching client management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/vhq4ehl.css" />
      </head>

      <body className="f-hr antialiased">
        <AuthSessionProvider>
          {/* <NavigationServerComponentWrapper /> */}
          <div className="flex flex-col h-screen">
            <Navigation />

            <main className="overflow-y-scroll h-full">{children}</main>

            <Footer />
          </div>

          <Toaster />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
