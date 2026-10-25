import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const phone = body.phone?.trim();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: isFirstUser ? "Super Admin" : "Employee",
      status: isFirstUser ? "approved" : "pending",
    });

    console.log("✅ User registered successfully in DB:", newUser._id);

    return NextResponse.json({ message: "Registration successful" }, { status: 201 });
  } catch (error) {
    console.error("❌ Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" }, 
      { status: 500 }
    );
  }
}