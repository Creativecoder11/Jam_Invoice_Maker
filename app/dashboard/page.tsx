"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, AlertCircle, Eye, Search,
} from "lucide-react";
import { InvoiceFormData } from "@/types/invoice";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid, Tooltip,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  format, differenceInDays, startOfWeek, startOfMonth,
  eachDayOfInterval, subDays, subWeeks, subMonths, subYears,
} from "date-fns";

type ChartRange = "daily" | "weekly" | "monthly" | "yearly";
type Invoice = InvoiceFormData & { _id: string; createdAt: string };

function fmtAmount(n: number) {
  if (n >= 1_000_000) return "৳" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "৳" + (n / 1_000).toFixed(1) + "k";
  return "৳" + n.toFixed(0);
}

function fmtFull(n: number) {
  return "৳" + n.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Cash Flow Chart ────────────────────────────────────────────────────────────
function CashFlowChart({ invoices }: { invoices: Invoice[] }) {
  const [range, setRange] = useState<ChartRange>("monthly");

  const data = useMemo(() => {
    const now = new Date();

    if (range === "daily") {
      return eachDayOfInterval({ start: subDays(now, 6), end: now }).map((day) => {
        const slice = invoices.filter((inv) => {
          const d = new Date(inv.date);
          return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
        });
        return {
          label: format(day, "EEE"),
          paid: slice.filter((i) => i.status === "Paid").reduce((s, i) => s + i.total, 0),
          outstanding: slice.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.total, 0),
        };
      });
    }

    if (range === "weekly") {
      return Array.from({ length: 8 }, (_, i) => {
        const week = subWeeks(now, 7 - i);
        const start = startOfWeek(week);
        const slice = invoices.filter((inv) => format(startOfWeek(new Date(inv.date)), "yyyy-MM-dd") === format(start, "yyyy-MM-dd"));
        return {
          label: format(start, "dd MMM"),
          paid: slice.filter((i) => i.status === "Paid").reduce((s, i) => s + i.total, 0),
          outstanding: slice.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.total, 0),
        };
      });
    }

    if (range === "yearly") {
      return Array.from({ length: 5 }, (_, i) => {
        const year = subYears(now, 4 - i);
        const slice = invoices.filter((inv) => new Date(inv.date).getFullYear() === year.getFullYear());
        return {
          label: format(year, "yyyy"),
          paid: slice.filter((i) => i.status === "Paid").reduce((s, i) => s + i.total, 0),
          outstanding: slice.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.total, 0),
        };
      });
    }

    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const start = startOfMonth(month);
      const slice = invoices.filter((inv) => {
        const d = new Date(inv.date);
        return d.getMonth() === start.getMonth() && d.getFullYear() === start.getFullYear();
      });
      return {
        label: format(start, "MMM"),
        paid: slice.filter((i) => i.status === "Paid").reduce((s, i) => s + i.total, 0),
        outstanding: slice.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.total, 0),
      };
    });
  }, [invoices, range]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-[#1A1A1A] text-base md:text-lg">Cash Flow</h3>
          <p className="text-xs md:text-sm text-[#1A1A1A]/40 mt-0.5">Income vs Outstanding invoices</p>
        </div>
        {/* Range toggle */}
        <div className="flex items-center bg-[#F0F0F0] rounded-xl p-1 gap-0.5">
          {(["daily", "weekly", "monthly", "yearly"] as ChartRange[]).map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 capitalize
                ${range === item
                  ? "bg-white shadow-sm text-[#1A1A1A]"
                  : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70"
                }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-4">
        <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/50">
          <span className="w-2.5 h-2.5 rounded-full bg-[#51B9A9]" />
          Paid
        </div>
        <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/50">
          <span className="w-2.5 h-2.5 rounded-full bg-[#5A378F]" />
          Outstanding
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px] w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={range}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={6}>
                <CartesianGrid vertical={false} stroke="#F0F0F0" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "#1A1A1A", opacity: 0.35, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(90,55,143,0.04)" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "0.5px solid #E0E0E0",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                    padding: "8px 12px",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="paid" name="Paid" fill="#51B9A9" radius={[6, 6, 0, 0]} animationDuration={1000} />
                <Bar dataKey="outstanding" name="Outstanding" fill="#5A378F" radius={[6, 6, 0, 0]} animationDuration={1400} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Status badge config ────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  Paid: { label: "Paid", cls: "bg-[#E1F5EE] text-[#085041]" },
  Unpaid: { label: "Unpaid", cls: "bg-[#EEEDFE] text-[#3C3489]" },
  Hold: { label: "Pending", cls: "bg-[#EEEDFE] text-[#3C3489]" },
};

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/invoices?type=invoice").then((r) => r.json()),
      fetch("/api/invoices?type=serviceInvoice").then((r) => r.json()),
    ])
      .then(([inv, inv2]) => {
        const combined = [
          ...(Array.isArray(inv) ? inv : []),
          ...(Array.isArray(inv2) ? inv2 : []),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInvoices(combined);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const paid = invoices.filter((i) => i.status === "Paid");
    const unpaid = invoices.filter((i) => i.status !== "Paid");
    const overdue = invoices.filter((i) => i.status !== "Paid" && new Date(i.dueDate) < now);
    const sum = (arr: Invoice[]) => arr.reduce((s, i) => s + i.total, 0);
    return {
      total: { count: invoices.length, amount: sum(invoices) },
      paid: { count: paid.length, amount: sum(paid) },
      unpaid: { count: unpaid.length, amount: sum(unpaid) },
      overdue: { count: overdue.length, amount: sum(overdue) },
    };
  }, [invoices]);

  const overdueList = useMemo(() => {
    const now = new Date();
    return invoices
      .filter((i) => i.status !== "Paid" && new Date(i.dueDate) < now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 8);
  }, [invoices]);

  const filtered = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (i) =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.to.name.toLowerCase().includes(q) ||
        (i.to.email ?? "").toLowerCase().includes(q),
    );
  }, [invoices, search]);

  const statCards = [
    { label: "Total Invoices", amount: stats.total.amount, count: stats.total.count, trend: "+17%", up: true },
    { label: "Paid", amount: stats.paid.amount, count: stats.paid.count, trend: "+32%", up: true },
    { label: "Unpaid", amount: stats.unpaid.amount, count: stats.unpaid.count, trend: "-17%", up: false },
    { label: "Overdue", amount: stats.overdue.amount, count: stats.overdue.count, trend: "+5%", up: false },
  ];

  return (
    <div className="space-y-5">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">Dashboard</h1>
        <p className="text-sm md:text-base text-[#1A1A1A]/60 mt-0.5">
          Welcome back, {session?.user?.name ?? "there"}!
        </p>
      </div>

      {/* Stat cards */}
      <div className="bg-white rounded-xl border border-[#E8E8E8] grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#F0F0F0]">
        {statCards.map(({ label, amount, count, trend, up }) => (
          <div key={label} className="p-5">
            <div className={`flex items-center gap-1 text-xs font-semibold mb-3 ${up ? "text-[#0F6E56]" : "text-[#993556]"}`}>
              {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{trend} /month</span>
            </div>
            <div className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] mb-1 truncate">
              {loading ? <Skeleton className="h-7 w-28 mt-1" /> : fmtFull(amount)}
            </div>
            <div className="text-xs md:text-sm text-[#1A1A1A]/60 flex items-center gap-1">
              {label}&nbsp;
              {loading
                ? <Skeleton className="inline-block h-4 w-8" />
                : <span className="text-[#1A1A1A]/60 font-semibold">({count})</span>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Cash Flow + Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Cash Flow */}
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-5">
          {loading ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-40" /></div>
                <Skeleton className="h-8 w-56 rounded-xl" />
              </div>
              <div className="flex items-center gap-5 mb-4"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-20" /></div>
              <div className="flex items-end gap-3 h-50 pt-4">
                {[65, 40, 80, 55, 90, 45].map((h, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          ) : (
            <CashFlowChart invoices={invoices} />
          )}
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-xl border border-[#E8E8E8] flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
            <div>
              <h3 className="font-semibold text-[#1A1A1A] text-base md:text-lg">Overdue Invoices</h3>
              <p className="text-xs md:text-sm text-[#1A1A1A]/40 mt-0.5">Past their due date</p>
            </div>
            {stats.overdue.count > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#72243E] bg-[#FBEAF0] px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                {stats.overdue.count} overdue
              </span>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="divide-y divide-[#F0F0F0]">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-16" /></div>
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-4 w-16 ml-4" />
                  </div>
                ))}
              </div>
            ) : overdueList.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#1A1A1A]/30">No overdue invoices 🎉</div>
            ) : (
              <div className="divide-y divide-[#F0F0F0]">
                {overdueList.map((inv) => {
                  const days = differenceInDays(new Date(), new Date(inv.dueDate));
                  const badge = STATUS_BADGE[inv.status] ?? STATUS_BADGE.Unpaid;
                  return (
                    <div key={inv._id} className="flex items-center justify-between px-5 py-3 hover:bg-[#F0F0F0]/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[#1A1A1A]">{inv.invoiceNumber}</span>
                          <span className="text-xs font-semibold text-[#72243E] bg-[#FBEAF0] px-1.5 py-0.5 rounded-md">
                            {days}d overdue
                          </span>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#1A1A1A]/40 mt-0.5 truncate">
                          {inv.to.name} · due {format(new Date(inv.dueDate), "dd MMM yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <span className="text-sm font-semibold text-[#51B9A9]">{fmtFull(inv.total)}</span>
                        <Link href={`/dashboard/${inv.type === "serviceInvoice" ? "service-invoices" : "invoices"}/${inv._id}`}>
                          <button className="p-1.5 rounded-lg hover:bg-[#F0F0F0] transition-colors">
                            <Eye className="h-3.5 w-3.5 text-[#1A1A1A]/60" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {overdueList.length > 0 && (
            <div className="px-5 py-3 border-t border-[#F0F0F0] shrink-0">
              <Link href="/dashboard/invoices" className="text-xs md:text-sm text-[#51B9A9] font-semibold hover:underline">
                View all invoices →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* All Invoices Table */}
      <div className="bg-white rounded-xl border border-[#E8E8E8]">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-[#1A1A1A] text-base md:text-lg">All Invoices</h3>
            <p className="text-xs md:text-sm text-[#1A1A1A]/40 mt-0.5">Complete invoice history</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1A1A1A]/30 pointer-events-none" />
              <input
                type="text"
                placeholder="Search invoices…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm border border-[#E8E8E8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A378F]/20 focus:border-[#5A378F]/40 w-48 bg-[#F0F0F0]/50 text-[#1A1A1A] placeholder:text-[#1A1A1A]/30"
              />
            </div>
            <Link href="/dashboard/invoices" className="text-xs md:text-sm text-[#51B9A9] font-semibold hover:underline whitespace-nowrap">
              All Invoices →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F0F0F0]/60 border-t border-[#E8E8E8]">
                  {["Invoice ID", "Client", "Date", "Due Date", "Amount", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider first:pl-5">
                      {h}
                    </th>
                  ))}
                  <th className="pr-5 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {[...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td className="pl-5 pr-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="pr-5 pl-4 py-3.5"><Skeleton className="h-7 w-7 rounded-lg ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-[#1A1A1A]/30 text-sm">No invoices found.</div>
          ) : (
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="bg-[#F0F0F0]/60 border-t border-[#E8E8E8]">
                  {["Invoice ID", "Type", "Client", "Date", "Due Date", "Amount", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider first:pl-5">
                      {h}
                    </th>
                  ))}
                  <th className="pr-5 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {filtered.map((inv) => {
                  const badge = STATUS_BADGE[inv.status] ?? { label: inv.status, cls: "bg-[#F0F0F0] text-[#1A1A1A]/60" };
                  const now = new Date();
                  const isOverdue = inv.status !== "Paid" && new Date(inv.dueDate) < now;
                  return (
                    <tr key={inv._id} className="hover:bg-[#F0F0F0]/40 transition-colors">
                      <td className="pl-5 pr-4 py-3.5 font-semibold text-[#1A1A1A]">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${inv.type === "serviceInvoice" ? "bg-[#EEEDFE] text-[#3C3489]" : "bg-[#E1F5EE] text-[#085041]"}`}>
                          {inv.type === "serviceInvoice" ? "Service" : "Invoice"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#1A1A1A]/70">{inv.to.name}</td>
                      <td className="px-4 py-3.5 text-[#1A1A1A]/50">{format(new Date(inv.date), "dd MMM yyyy")}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-sm ${isOverdue ? "text-[#993556] font-semibold" : "text-[#1A1A1A]/50"}`}>
                          {format(new Date(inv.dueDate), "dd MMM yyyy")}
                          {isOverdue && <span className="ml-1 text-xs">· {differenceInDays(now, new Date(inv.dueDate))}d</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#51B9A9]">{fmtFull(inv.total)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="pr-5 pl-4 py-3.5">
                        <Link href={`/dashboard/${inv.type === "serviceInvoice" ? "service-invoices" : "invoices"}/${inv._id}`}>
                          <button className="p-1.5 rounded-lg hover:bg-[#F0F0F0] transition-colors">
                            <Eye className="h-4 w-4 text-[#1A1A1A]/60" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-[#F0F0F0] text-xs text-[#1A1A1A]/30">
            {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
            {search && invoices.length !== filtered.length && (
              <span className="ml-1">of {invoices.length} total</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}