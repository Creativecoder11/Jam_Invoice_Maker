import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { User } from "@/models/User";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Super Admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { status, role } = await req.json();
    const resolvedParams = await params;

    if (status !== undefined && !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    if (role !== undefined && !["Super Admin", "Employee"].includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    if (role !== undefined && resolvedParams.id === session.user.id) {
      return NextResponse.json({ message: "Cannot change your own role" }, { status: 400 });
    }

    const update: Record<string, string> = {};
    if (status !== undefined) update.status = status;
    if (role !== undefined) {
      update.role = role;
      // Super Admins must be approved so they can log in
      if (role === "Super Admin") update.status = "approved";
    }

    await dbConnect();
    const updatedUser = await User.findByIdAndUpdate(resolvedParams.id, update, { new: true });

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("User PATCH Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
