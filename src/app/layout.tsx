import type React from "react";
import type { Metadata } from "next";
import AuthSessionProvider from "@/components/providers/session-provider";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 w-full">
              <div className="p-8">{children}</div>
            </main>
          </SidebarProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
