import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { Client } from "@/models/Client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const clients = await Client.find({}).sort({ name: 1 }).lean();
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Super Admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    if (!data.name?.trim()) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    await dbConnect();
    const client = await Client.create({ ...data, creatorId: session.user.id });
    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Error" }, { status: 500 });
  }
}
