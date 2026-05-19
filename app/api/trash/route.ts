import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { Invoice } from "@/models/Invoice";
import { Client } from "@/models/Client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Super Admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const [invoices, clients] = await Promise.all([
      Invoice.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean(),
      Client.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean(),
    ]);

    return NextResponse.json({ invoices, clients });
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
