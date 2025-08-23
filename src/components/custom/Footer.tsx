"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Object of authenticated routes
  const authenticatedRoutes = {
    "/teams": true,
    "/team/[id]": true, // pattern
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
        <footer>
          <p>© {new Date().getFullYear()} Clientmap. All rights reserved.</p>
          <p>App</p>
        </footer>
      ) : (
        <footer>
          <p>© {new Date().getFullYear()} Clientmap. All rights reserved.</p>
          <p>Landing page</p>
        </footer>
      )}
    </>
  );
}
