import { getServerSession as getNextAuthServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Session } from "next-auth"

export async function getServerSession(): Promise<Session | null> {
  try {
    const session = await getNextAuthServerSession(authOptions)
    return session
  } catch (error) {
    console.error("Session error:", error)
    return null
  }
}

export async function requireAuth(): Promise<Session> {
  const session = await getServerSession()

  if (!session || !session.user) {
    redirect("/login")
  }

  return session
}


// // Error: Module '"@/lib/auth"' has no exported member 'auth'.ts(2305)
// import { auth } from "@/lib/auth"
// import { redirect } from "next/navigation"
// import type { Session } from "next-auth"

// export async function getServerSession(): Promise<Session | null> {
//   try {
//     const session = await auth()
//     return session
//   } catch (error) {
//     console.error("Session error:", error)
//     return null
//   }
// }

// export async function requireAuth(): Promise<Session> {
//   const session = await getServerSession()

//   if (!session || !session.user) {
//     redirect("/login")
//   }

//   return session
// }
