import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import User from "@/models/User"
import connectMongoDB from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    await connectMongoDB()
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 })
    }

    const lowercasedEmail = email.toLowerCase()
    const existingUser = await User.findOne({ email: lowercasedEmail })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists." }, { status: 409 })
    }

    const hashedPassword = await hash(password, 10)

    const newUser = await User.create({
      name,
      email: lowercasedEmail,
      password: hashedPassword,
      subscription: {
        planId: "free",
        status: "active",
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        stripePriceId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
      activeBoltOnIds: [],
    })

    return NextResponse.json({ message: "User registered successfully.", user: newUser }, { status: 201 })
  } catch (error) {
    console.error("REGISTRATION_ERROR:", error)
    return NextResponse.json({ error: "An error occurred while registering the user." }, { status: 500 })
  }
}
