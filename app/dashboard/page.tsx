"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, AlertCircle, Eye, MoreHorizontal, Search,
} from "lucide-react";
// import { format, differenceInDays } from "date-fns";
import { InvoiceFormData } from "@/types/invoice";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  differenceInDays,
  startOfWeek,
  startOfMonth,
  startOfYear,
  eachDayOfInterval,
  subDays,
  subWeeks,
  subMonths,
  subYears,
} from "date-fns";

type ChartRange = "daily" | "weekly" | "monthly" | "yearly";

type Invoice = InvoiceFormData & { _id: string; createdAt: string };

function fmtAmount(n: number) {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return "$" + (n / 1_000).toFixed(1) + "k";
  return "$" + n.toFixed(0);
}

function fmtFull(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Cash Flow Bar Chart ────────────────────────────────────────────────────────
function CashFlowChart({ invoices }: { invoices: Invoice[] }) {
  const [range, setRange] = useState<ChartRange>("monthly");

  const data = useMemo(() => {
    const now = new Date();

    // ── DAILY ─────────────────────────────────────
    if (range === "daily") {
      return eachDayOfInterval({
        start: subDays(now, 6),
        end: now,
      }).map((day) => {
        const slice = invoices.filter((inv) => {
          const d = new Date(inv.date);

          return (
            d.getDate() === day.getDate() &&
            d.getMonth() === day.getMonth() &&
            d.getFullYear() === day.getFullYear()
          );
        });

        return {
          label: format(day, "EEE"),
          paid: slice
            .filter((i) => i.status === "Paid")
            .reduce((s, i) => s + i.total, 0),

          outstanding: slice
            .filter((i) => i.status !== "Paid")
            .reduce((s, i) => s + i.total, 0),
        };
      });
    }

    // ── WEEKLY ────────────────────────────────────
    if (range === "weekly") {
      return Array.from({ length: 8 }, (_, i) => {
        const week = subWeeks(now, 7 - i);
        const start = startOfWeek(week);

        const slice = invoices.filter((inv) => {
          const d = new Date(inv.date);

          return (
            format(startOfWeek(d), "yyyy-MM-dd") ===
            format(start, "yyyy-MM-dd")
          );
        });

        return {
          label: format(start, "dd MMM"),
          paid: slice
            .filter((i) => i.status === "Paid")
            .reduce((s, i) => s + i.total, 0),

          outstanding: slice
            .filter((i) => i.status !== "Paid")
            .reduce((s, i) => s + i.total, 0),
        };
      });
    }

    // ── YEARLY ────────────────────────────────────
    if (range === "yearly") {
      return Array.from({ length: 5 }, (_, i) => {
        const year = subYears(now, 4 - i);

        const slice = invoices.filter((inv) => {
          const d = new Date(inv.date);

          return d.getFullYear() === year.getFullYear();
        });

        return {
          label: format(year, "yyyy"),
          paid: slice
            .filter((i) => i.status === "Paid")
            .reduce((s, i) => s + i.total, 0),

          outstanding: slice
            .filter((i) => i.status !== "Paid")
            .reduce((s, i) => s + i.total, 0),
        };
      });
    }

    // ── MONTHLY DEFAULT ───────────────────────────
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const start = startOfMonth(month);

      const slice = invoices.filter((inv) => {
        const d = new Date(inv.date);

        return (
          d.getMonth() === start.getMonth() &&
          d.getFullYear() === start.getFullYear()
        );
      });

      return {
        label: format(start, "MMM"),
        paid: slice
          .filter((i) => i.status === "Paid")
          .reduce((s, i) => s + i.total, 0),

        outstanding: slice
          .filter((i) => i.status !== "Paid")
          .reduce((s, i) => s + i.total, 0),
      };
    });
  }, [invoices, range]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">
            Cash Flow
          </h3>

          <p className="text-sm text-gray-400 mt-1">
            Income vs Outstanding invoices
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center bg-gray-100 rounded-2xl p-1 gap-1">
          {(
            ["daily", "weekly", "monthly", "yearly"] as ChartRange[]
          ).map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 capitalize
              ${
                range === item
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-3 h-3 rounded-full bg-indigo-500" />
          Paid
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-3 h-3 rounded-full bg-orange-400" />
          Outstanding
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px] w-full">
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
              <BarChart
                data={data}
                barGap={8}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="label"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  cursor={{ fill: "rgba(99,102,241,0.05)" }}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    padding: "10px 14px",
                  }}
                />

                {/* Paid */}
                <Bar
                  dataKey="paid"
                  fill="#6366f1"
                  radius={[10, 10, 0, 0]}
                  animationDuration={1000}
                />

                {/* Outstanding */}
                <Bar
                  dataKey="outstanding"
                  fill="#fb923c"
                  radius={[10, 10, 0, 0]}
                  animationDuration={1400}
                />
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
  Paid:   { label: "Paid",    cls: "bg-gray-100 text-gray-600" },
  Unpaid: { label: "Unpaid",  cls: "bg-purple-100 text-purple-700" },
  Hold:   { label: "Pending", cls: "bg-yellow-100 text-yellow-700" },
};

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  useEffect(() => {
    fetch("/api/invoices?type=invoice")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setInvoices(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now   = new Date();
    const paid   = invoices.filter((i) => i.status === "Paid");
    const unpaid = invoices.filter((i) => i.status !== "Paid");
    const overdue = invoices.filter(
      (i) => i.status !== "Paid" && new Date(i.dueDate) < now,
    );
    const sum = (arr: Invoice[]) => arr.reduce((s, i) => s + i.total, 0);
    return {
      total:   { count: invoices.length, amount: sum(invoices) },
      paid:    { count: paid.length,     amount: sum(paid) },
      unpaid:  { count: unpaid.length,   amount: sum(unpaid) },
      overdue: { count: overdue.length,  amount: sum(overdue) },
    };
  }, [invoices]);

  // ── Overdue invoices (most overdue first) ──────────────────────────────────
  const overdueList = useMemo(() => {
    const now = new Date();
    return invoices
      .filter((i) => i.status !== "Paid" && new Date(i.dueDate) < now)
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )
      .slice(0, 8);
  }, [invoices]);

  // ── Filtered all-invoices list ─────────────────────────────────────────────
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

  // ── Stat card data ─────────────────────────────────────────────────────────
  const statCards = [
    { label: "Total Invoices", amount: stats.total.amount,   count: stats.total.count,   trend: "+17%", up: true  },
    { label: "Paid",           amount: stats.paid.amount,    count: stats.paid.count,    trend: "+32%", up: true  },
    { label: "Unpaid",         amount: stats.unpaid.amount,  count: stats.unpaid.count,  trend: "-17%", up: false },
    { label: "Overdue",        amount: stats.overdue.amount, count: stats.overdue.count, trend: "+5%",  up: false },
  ];

  return (
    <div className="space-y-5">

      {/* ── Welcome ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Welcome back, {session?.user?.name ?? "there"}!
        </p>
      </div>

      {/* ── Stats cards ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
        {statCards.map(({ label, amount, count, trend, up }) => (
          <div key={label} className="p-6">
            <div
              className={`flex items-center gap-1 text-xs font-semibold mb-3 ${
                up ? "text-indigo-500" : "text-red-400"
              }`}
            >
              {up ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trend} /month</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1 truncate">
              {loading ? (
                <span className="text-gray-200">—</span>
              ) : (
                fmtFull(amount)
              )}
            </div>
            <div className="text-sm text-gray-400">
              {label}&nbsp;
              <span className="text-gray-600 font-semibold">
                ({loading ? "…" : count})
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Cash Flow + Overdue (50 / 50) ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Cash Flow */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {loading ? (
            <div className="h-52 flex items-center justify-center text-gray-300 text-sm animate-pulse">
              Loading chart…
            </div>
          ) : (
            <CashFlowChart invoices={invoices} />
          )}
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Overdue Invoices</h3>
              <p className="text-xs text-gray-400 mt-0.5">Past their due date</p>
            </div>
            {stats.overdue.count > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                {stats.overdue.count} overdue
              </span>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="py-10 text-center text-gray-300 text-sm animate-pulse">
                Loading…
              </div>
            ) : overdueList.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                No overdue invoices 🎉
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {overdueList.map((inv) => {
                  const days = differenceInDays(new Date(), new Date(inv.dueDate));
                  const badge = STATUS_BADGE[inv.status] ?? STATUS_BADGE.Unpaid;
                  return (
                    <div
                      key={inv._id}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                            {days}d overdue
                          </span>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {inv.to.name} · due {format(new Date(inv.dueDate), "dd MMM yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <span className="text-sm font-bold text-gray-900">
                          {fmtFull(inv.total)}
                        </span>
                        <Link href={`/dashboard/invoices/${inv._id}`}>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <Eye className="h-3.5 w-3.5 text-gray-400" />
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
            <div className="px-6 py-3 border-t border-gray-50 shrink-0">
              <Link
                href="/dashboard/invoices"
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                View all invoices →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── All Invoices Table ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

        {/* Table header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-base">All Invoices</h3>
            <p className="text-xs text-gray-400 mt-0.5">Complete invoice history</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search invoices…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 w-52 bg-gray-50"
              />
            </div>
            <Link
              href="/dashboard/invoices"
              className="text-xs text-indigo-600 font-semibold hover:underline whitespace-nowrap"
            >
              All Invoices →
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-gray-300 text-sm animate-pulse">
              Loading invoices…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              No invoices found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 border-t border-gray-100">
                  {["Invoice ID", "Client", "Date", "Due Date", "Amount", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider first:pl-6"
                      >
                        {h}
                      </th>
                    ),
                  )}
                  <th className="pr-6 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((inv) => {
                  const badge =
                    STATUS_BADGE[inv.status] ?? { label: inv.status, cls: "bg-gray-100 text-gray-600" };
                  const now = new Date();
                  const isOverdue =
                    inv.status !== "Paid" && new Date(inv.dueDate) < now;
                  return (
                    <tr
                      key={inv._id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="pl-6 pr-4 py-3.5 font-semibold text-gray-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3.5 text-gray-700">{inv.to.name}</td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {format(new Date(inv.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-sm ${
                            isOverdue ? "text-red-500 font-semibold" : "text-gray-500"
                          }`}
                        >
                          {format(new Date(inv.dueDate), "dd MMM yyyy")}
                          {isOverdue && (
                            <span className="ml-1 text-xs">
                              ·{" "}
                              {differenceInDays(now, new Date(inv.dueDate))}d
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">
                        {fmtFull(inv.total)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="pr-6 pl-4 py-3.5">
                        <div className="flex items-center gap-0.5 justify-end">
                          <Link href={`/dashboard/invoices/${inv._id}`}>
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                              <Eye className="h-4 w-4 text-gray-400" />
                            </button>
                          </Link>
                          {/* <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 text-xs text-gray-400">
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
