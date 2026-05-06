import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { Feedback } from "@/models/Feedback";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { message, rating } = await req.json();

    if (!message || rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    await dbConnect();
    const fb = await Feedback.create({
      message,
      rating,
      userId: session.user.id,
    });

    return NextResponse.json(fb, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Super Admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).populate("userId", "name email");

    return NextResponse.json(feedbacks);
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
