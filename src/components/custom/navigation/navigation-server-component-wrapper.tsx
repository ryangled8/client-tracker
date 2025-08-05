// Server component to fetch user via session

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navigation from "./navigation";

export default async function NavigationServerComponentWrapper() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <Navigation user={session.user} />;
}
