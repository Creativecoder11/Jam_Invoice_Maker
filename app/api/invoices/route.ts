import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { Invoice } from "@/models/Invoice";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Super Admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    await dbConnect();

    const invoice = await Invoice.create({
      ...data,
      creatorId: session.user.id,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("Create invoice error", error);
    return NextResponse.json({ message: error.message || "Internal Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "invoice";
    const status = searchParams.get("status");

    await dbConnect();

    const query: any = { type };
    if (status && status !== "ALL") {
      query.status = status;
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 }).populate("creatorId", "name email");

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Get invoices error", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
