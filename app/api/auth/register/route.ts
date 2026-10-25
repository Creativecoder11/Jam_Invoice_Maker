import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    // 🔑 CRITICAL: Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: isFirstUser ? "Super Admin" : "Employee",
      status: isFirstUser ? "approved" : "pending",
    });

    return NextResponse.json({ message: "Registration successful" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}