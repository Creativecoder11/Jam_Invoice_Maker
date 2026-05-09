"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Plus, Search, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
  MoreHorizontal, Eye, Edit, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { InvoiceFormData } from "@/types/invoice";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

type Invoice = InvoiceFormData & { _id: string; createdAt: string };
type SortField = "invoiceNumber" | "clientName" | "date" | "total";
type SortDir   = "asc" | "desc";
type TabFilter = "all" | "Unpaid" | "Paid" | "Hold" | "Cancelled";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  Paid:      { label: "Paid",      className: "bg-gray-100 text-gray-600" },
  Unpaid:    { label: "Due",       className: "bg-purple-100 text-purple-700" },
  Hold:      { label: "Hold",      className: "bg-yellow-100 text-yellow-700" },
  Cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600" },
};

const SELECT_CLASS: Record<string, string> = {
  Paid:      "bg-gray-100 text-gray-600",
  Unpaid:    "bg-purple-100 text-purple-700",
  Hold:      "bg-yellow-100 text-yellow-700",
  Cancelled: "bg-red-100 text-red-600",
};

const TAB_BADGE: Record<string, string> = {
  Unpaid:    "bg-orange-100 text-orange-600",
  Paid:      "bg-green-100 text-green-700",
  Hold:      "bg-yellow-100 text-yellow-700",
  Cancelled: "bg-red-100 text-red-500",
};

// ── 3-dot Row Menu ────────────────────────────────────────────────────────────
function RowMenu({ onDraft, onDelete, isDeleting }: { onDraft: () => void; onDelete: () => void; isDeleting?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
          <button
            onClick={() => { onDraft(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
          >
            <Edit className="h-3.5 w-3.5 text-gray-400" />
            Mark as Draft
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            disabled={isDeleting}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left disabled:opacity-50"
          >
            {isDeleting ? <Spinner className="h-3.5 w-3.5 text-red-500" /> : <Trash2 className="h-3.5 w-3.5" />}
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sort button ───────────────────────────────────────────────────────────────
function SortBtn({
  field, active, dir, onClick,
}: { field: SortField; active: SortField; dir: SortDir; onClick: () => void }) {
  const Icon = active !== field ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button onClick={onClick} className="flex items-center gap-0.5 group">
      <Icon className={`h-3 w-3 ${active === field ? "text-indigo-600" : "text-gray-300 group-hover:text-gray-500"}`} />
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "Super Admin";

  const [invoices, setInvoices]   = useState<Invoice[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/invoices?type=invoice")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setInvoices(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: string) => {
    setInvoices((prev) => prev.map((i) => i._id === id ? { ...i, status: status as any } : i));
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) toast.error("Failed to update status");
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInvoices((prev) => prev.filter((i) => i._id !== id));
        setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
        toast.success("Invoice deleted");
      } else {
        toast.error("Failed to delete invoice");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Tab counts ─────────────────────────────────────────────────────────────
  const tabCounts = useMemo(() => ({
    all:       invoices.length,
    Unpaid:    invoices.filter((i) => i.status === "Unpaid").length,
    Paid:      invoices.filter((i) => i.status === "Paid").length,
    Hold:      invoices.filter((i) => i.status === "Hold").length,
    Cancelled: invoices.filter((i) => i.status === "Cancelled").length,
  }), [invoices]);

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...invoices];
    if (activeTab !== "all") list = list.filter((i) => i.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.to.name.toLowerCase().includes(q) ||
          (i.to.email ?? "").toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortField === "clientName") { va = a.to.name; vb = b.to.name; }
      else if (sortField === "date")  { va = new Date(a.date).getTime(); vb = new Date(b.date).getTime(); }
      else if (sortField === "total") { va = a.total; vb = b.total; }
      else                            { va = a.invoiceNumber; vb = b.invoiceNumber; }
      if (typeof va === "string")
        return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === "asc" ? va - (vb as number) : (vb as number) - va;
    });
    return list;
  }, [invoices, activeTab, search, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const toggleAll  = () =>
    setSelected(allChecked ? new Set() : new Set(filtered.map((i) => i._id)));

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "Unpaid",    label: "Due" },
    { key: "Paid",      label: "Paid" },
    { key: "Hold",      label: "Hold" },
    { key: "Cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage and track all your invoices.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-base font-bold text-gray-900">
            All Invoices
            {!loading && <span className="ml-2 text-sm font-normal text-gray-400">({invoices.length})</span>}
          </h2>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Import
            </Button>
            {isSuperAdmin && (
              <Button asChild className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white">
                <Link href="/dashboard/invoices/create">
                  <Plus className="mr-2 h-4 w-4" /> New Invoice
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="flex items-center justify-between px-6 pb-3 gap-4 flex-wrap border-b border-gray-100">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const count    = tabCounts[tab.key];
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.label}
                  {tab.key !== "all" && count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold leading-none ${
                      isActive ? "bg-gray-900 text-white" : TAB_BADGE[tab.key]
                    }`}>{count}</span>
                  )}
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text" placeholder="Search..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 w-52 bg-gray-50"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <SlidersHorizontal className="h-4 w-4" /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 border-t border-gray-100">
                  {["", "Invoice ID", "Client", "Email", "Date", "Amount", "Status", ""].map((h, i) => (
                    <th key={i} className="px-3 py-3 first:pl-6 last:pr-6">
                      {h && <Skeleton className="h-3 w-16" />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ["w-4","w-20","w-28","w-32","w-20","w-16","w-14","w-16"],
                  ["w-4","w-24","w-24","w-36","w-20","w-16","w-16","w-16"],
                  ["w-4","w-20","w-32","w-28","w-20","w-12","w-14","w-16"],
                  ["w-4","w-24","w-20","w-32","w-20","w-16","w-16","w-16"],
                  ["w-4","w-20","w-28","w-24","w-20","w-14","w-14","w-16"],
                  ["w-4","w-24","w-24","w-36","w-20","w-16","w-16","w-16"],
                ].map((widths, ri) => (
                  <tr key={ri} className="border-t border-gray-50">
                    {widths.map((w, ci) => (
                      <td key={ci} className="px-3 py-4 first:pl-6 last:pr-6">
                        <Skeleton className={`h-4 ${w}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">No invoices found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 border-t border-gray-100">
                  <th className="pl-6 pr-3 py-3 w-10">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll}
                      className="rounded border-gray-300 accent-indigo-600 cursor-pointer" />
                  </th>
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Invoice ID <SortBtn field="invoiceNumber" active={sortField} dir={sortDir} onClick={() => handleSort("invoiceNumber")} />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Client <SortBtn field="clientName" active={sortField} dir={sortDir} onClick={() => handleSort("clientName")} />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Date <SortBtn field="date" active={sortField} dir={sortDir} onClick={() => handleSort("date")} />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Amount <SortBtn field="total" active={sortField} dir={sortDir} onClick={() => handleSort("total")} />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="pr-6 pl-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((inv) => {
                  const badge = STATUS_BADGE[inv.status] ?? { label: inv.status, className: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={inv._id} className={`transition-colors hover:bg-gray-50/60 ${selected.has(inv._id) ? "bg-indigo-50/40" : ""}`}>
                      <td className="pl-6 pr-3 py-4">
                        <input type="checkbox" checked={selected.has(inv._id)} onChange={() => toggleSelect(inv._id)}
                          className="rounded border-gray-300 accent-indigo-600 cursor-pointer" />
                      </td>
                      <td className="px-3 py-4 font-semibold text-gray-900">{inv.invoiceNumber}</td>
                      <td className="px-3 py-4 text-gray-700">{inv.to.name}</td>
                      <td className="px-3 py-4 text-gray-500">{inv.to.email ? `@${inv.to.email}` : "—"}</td>
                      <td className="px-3 py-4 text-gray-700">{format(new Date(inv.date), "dd MMM, yyyy")}</td>
                      <td className="px-3 py-4 font-semibold text-gray-900">${inv.total.toLocaleString()}</td>

                      {/* Status — dropdown for admins, badge for others */}
                      <td className="px-3 py-4">
                        {isSuperAdmin ? (
                          <select
                            value={inv.status}
                            onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 ${SELECT_CLASS[inv.status] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Due</option>
                            <option value="Hold">Hold</option>
                            <option value="Cancelled">Cancel</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="pr-6 pl-3 py-4">
                        <div className="flex items-center gap-0.5 justify-end">
                          <Link href={`/dashboard/invoices/${inv._id}`}>
                            <button title="Preview" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                              <Eye className="h-4 w-4 text-gray-400" />
                            </button>
                          </Link>
                          {isSuperAdmin && (
                            <Link href={`/dashboard/invoices/${inv._id}/edit`}>
                              <button title="Edit" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                <Edit className="h-4 w-4 text-gray-400" />
                              </button>
                            </Link>
                          )}
                          {isSuperAdmin && (
                            <RowMenu
                              onDraft={() => handleStatusChange(inv._id, "Hold")}
                              onDelete={() => handleDelete(inv._id)}
                              isDeleting={deletingId === inv._id}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 text-xs text-gray-400 flex items-center justify-between">
            <span>Showing {filtered.length} of {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
            {selected.size > 0 && <span className="text-indigo-600 font-semibold">{selected.size} selected</span>}
          </div>
        )}
      </div>
    </div>
  );
}
