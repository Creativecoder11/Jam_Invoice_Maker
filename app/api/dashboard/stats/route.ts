import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { Invoice } from "@/models/Invoice";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // If Employee, only show their stats? No, prompt says: "Super Admin: View all users data. Employee: View invoices, quotations".
    // I assume employees can see all invoices/quotations if they can "view invoices".
    
    const [totalInvoices, paidInvoices, unpaidInvoices, totalQuotations] = await Promise.all([
      Invoice.countDocuments({ type: "invoice" }),
      Invoice.countDocuments({ type: "invoice", status: "Paid" }),
      Invoice.countDocuments({ type: "invoice", status: { $ne: "Paid" } }),
      Invoice.countDocuments({ type: "quotation" }),
    ]);

    return NextResponse.json({
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      totalQuotations,
    });
  } catch (error) {
    console.error("Stats error", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
