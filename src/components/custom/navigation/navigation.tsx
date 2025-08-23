"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Bell, Settings, HelpCircle } from "lucide-react";
import React from "react";

// Icon mapping
const iconMap = {
  Users,
  Bell,
  Settings,
  HelpCircle,
};

const primaryNavLinks = [
  {
    href: "/teams",
    label: "Teams",
    icon: "Users",
  },
];

const secondaryNavLinks = [
  {
    href: "/invites",
    label: "Invites",
    icon: "Bell",
    iconOnly: true,
  },
  {
    href: "/account",
    label: "Account",
    icon: "Settings",
    iconOnly: true,
  },
  {
    href: "/help-centre",
    label: "Help Centre",
    icon: "HelpCircle",
    iconOnly: true,
  },
];

interface NavigationProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function Navigation({ user }: NavigationProps) {
  const pathname = usePathname();

  const renderLink = (
    link: { href: string; label: string; icon: string; iconOnly?: boolean },
    idx: number
  ) => {
    const Icon = iconMap[link.icon as keyof typeof iconMap];
    const isActive =
      pathname === link.href ||
      (link.href === "/teams" && pathname.startsWith("/team/"));

    return (
      <li key={idx}>
        <Link
          href={link.href}
          className={`flex items-center gap-1 f-hr transition-opacity ${
            isActive ? "opacity-100" : "opacity-60"
          } hover:opacity-100`}
        >
          {Icon && <Icon size={16} />}
          {!link.iconOnly && <>{link.label}</>}
        </Link>
      </li>
    );
  };

  // Object of authenticated routes
  const authenticatedRoutes = {
    "/teams": true,
    "/team/[id]": true, // use Next.js convention
    "/invites": true,
    "/account": true,
  };

  function pathToRegex(route: string) {
    // convert Next.js style dynamic segments to regex
    return new RegExp("^" + route.replace(/\[.*?\]/g, "[^/]+") + "$");
  }

  function isAuthenticatedRoute(path: string) {
    return Object.keys(authenticatedRoutes).some((route) =>
      pathToRegex(route).test(path)
    );
  }

  return (
    <>
      {isAuthenticatedRoute(pathname) ? (
        <nav className="flex justify-between items-center m-4">
          {/* Logo */}
          <div className="w-1/2 flex gap-8">
            <Link className="f-hm text-lg" href="/">
              Clientmap
            </Link>

            {/* Primary nav */}
            <ul className="flex gap-6 items-center justify-center">
              {primaryNavLinks.map(renderLink)}
            </ul>
          </div>

          {/* Right: Secondary nav + user */}
          <ul className="w-1/3 flex gap-6 items-center justify-end">
            {secondaryNavLinks.map(renderLink)}
            <div className="flex items-center gap-2">
              {user && <span>{user.name}</span>}
              Users name here
              <div className="rounded-full size-6 bg-black"></div>
            </div>
          </ul>
        </nav>
      ) : (
        <nav>Non-authenticated navigation</nav>
      )}
    </>
  );
}
