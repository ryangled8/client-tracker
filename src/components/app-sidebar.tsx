"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Users, Settings, Mail } from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Teams",
    href: "/teams",
    icon: Users,
  },
  {
    name: "Invites",
    href: "/invites",
    icon: Mail,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  const fetchPendingInvitesCount = async () => {
    try {
      const response = await fetch("/api/teams/invites/pending");
      if (response.ok) {
        const data = await response.json();
        setPendingInvitesCount(data.invites.length);
      }
    } catch (error) {
      console.error("Error fetching pending invites:", error);
    }
  };

  useEffect(() => {
    fetchPendingInvitesCount();

    // Listen for invite updates
    const handleInvitesUpdated = () => {
      fetchPendingInvitesCount();
    };

    window.addEventListener("invitesUpdated", handleInvitesUpdated);

    // Cleanup listener
    return () => {
      window.removeEventListener("invitesUpdated", handleInvitesUpdated);
    };
  }, []);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex h-16 items-center px-4">
          <h1 className="text-xl font-bold">Client Tracker</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const isInvites = item.name === "Invites";
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.name}</span>
                        {isInvites && pendingInvitesCount > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {pendingInvitesCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
