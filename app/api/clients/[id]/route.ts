import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { Client } from "@/models/Client";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Super Admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();
    await dbConnect();
    const client = await Client.findByIdAndUpdate(id, data, { new: true });
    if (!client) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(client);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Super Admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const client = await Client.findByIdAndDelete(id);
    if (!client) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Error" }, { status: 500 });
  }
}
