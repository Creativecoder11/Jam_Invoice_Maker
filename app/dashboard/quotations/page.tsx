"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Plus, Search, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
  MoreHorizontal, Eye, Edit, Trash2,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { InvoiceFormData } from "@/types/invoice";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";

type Quotation = InvoiceFormData & { _id: string; createdAt: string };
type SortField = "invoiceNumber" | "clientName" | "date" | "total";
type SortDir = "asc" | "desc";
type TabFilter = "all" | "Unpaid" | "Paid" | "Hold" | "Cancelled";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  Paid: { label: "Accepted", className: "bg-[#E1F5EE] text-[#085041]" },
  Unpaid: { label: "Pending", className: "bg-[#EEEDFE] text-[#3C3489]" },
  Hold: { label: "Draft", className: "bg-[#FFF8E1] text-[#7A5C00]" },
  Cancelled: { label: "Cancelled", className: "bg-[#FBEAF0] text-[#72243E]" },
};

const SELECT_CLASS: Record<string, string> = {
  Paid: "bg-[#E1F5EE] text-[#085041]",
  Unpaid: "bg-[#EEEDFE] text-[#3C3489]",
  Hold: "bg-[#FFF8E1] text-[#7A5C00]",
  Cancelled: "bg-[#FBEAF0] text-[#72243E]",
};

const TAB_BADGE: Record<string, string> = {
  Unpaid: "bg-[#EEEDFE] text-[#3C3489]",
  Paid: "bg-[#E1F5EE] text-[#085041]",
  Hold: "bg-[#FFF8E1] text-[#7A5C00]",
  Cancelled: "bg-[#FBEAF0] text-[#72243E]",
};

// ── 3-dot Row Menu ────────────────────────────────────────────────────────────
function RowMenu({
  onDraft,
  onDelete,
  isDeleting,
  openUp = true,
}: {
  onDraft: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  openUp?: boolean;
}) {
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
        className="p-1.5 rounded-lg hover:bg-[#F0F0F0] transition-colors"
      >
        <MoreHorizontal className="h-4 w-4 text-[#1A1A1A]/30" />
      </button>
      {open && (
        <div
          className={`absolute right-0 ${openUp ? "bottom-full mb-1" : "top-full -mt-3"
            } w-40 bg-white border border-[#E8E8E8] rounded-xl shadow-xl z-[150] overflow-hidden`}
        >
          <button
            onClick={() => { onDraft(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#1A1A1A]/70 hover:bg-[#F0F0F0] text-left"
          >
            <Edit className="h-3.5 w-3.5 text-[#1A1A1A]/40" />
            Mark as Draft
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            disabled={isDeleting}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#72243E] hover:bg-[#FBEAF0] text-left disabled:opacity-50"
          >
            {isDeleting ? <Spinner className="h-3.5 w-3.5 text-[#EA2B7B]" /> : <Trash2 className="h-3.5 w-3.5" />}
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
      <Icon className={`h-3 w-3 ${active === field ? "text-[#5A378F]" : "text-[#1A1A1A]/20 group-hover:text-[#1A1A1A]/40"}`} />
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function QuotationsPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "Super Admin";

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);

  useEffect(() => {
    fetch("/api/invoices?type=quotation")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setQuotations(data); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setQuotations((prev) => prev.map((q) => q._id === id ? { ...q, status: status as any } : q));
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuotations((prev) => prev.filter((q) => q._id !== id));
        setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
        setDeleteTarget(null);
        toast.success("Quotation moved to trash");
      } else {
        toast.error("Failed to delete quotation");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const tabCounts = useMemo(() => ({
    all: quotations.length,
    Unpaid: quotations.filter((q) => q.status === "Unpaid").length,
    Paid: quotations.filter((q) => q.status === "Paid").length,
    Hold: quotations.filter((q) => q.status === "Hold").length,
    Cancelled: quotations.filter((q) => q.status === "Cancelled").length,
  }), [quotations]);

  const filtered = useMemo(() => {
    let list = [...quotations];
    if (activeTab !== "all") list = list.filter((q) => q.status === activeTab);
    if (search.trim()) {
      const sq = search.toLowerCase();
      list = list.filter(
        (q) =>
          q.invoiceNumber.toLowerCase().includes(sq) ||
          q.to.name.toLowerCase().includes(sq) ||
          (q.to.email ?? "").toLowerCase().includes(sq),
      );
    }
    list.sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortField === "clientName") { va = a.to.name; vb = b.to.name; }
      else if (sortField === "date") { va = new Date(a.date).getTime(); vb = new Date(b.date).getTime(); }
      else if (sortField === "total") { va = a.total; vb = b.total; }
      else { va = a.invoiceNumber; vb = b.invoiceNumber; }
      if (typeof va === "string")
        return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === "asc" ? va - (vb as number) : (vb as number) - va;
    });
    return list;
  }, [quotations, activeTab, search, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(filtered.map((q) => q._id)));

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "Unpaid", label: "Pending" },
    { key: "Paid", label: "Accepted" },
    { key: "Hold", label: "Draft" },
    { key: "Cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-5">
      <DeleteConfirmModal
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        itemName={deleteTarget?.invoiceNumber}
        itemLabel="quotation"
        onConfirm={handleDelete}
        isDeleting={!!deletingId}
      />

      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">Quotations</h1>
        <p className="text-sm md:text-base text-[#1A1A1A]/60 mt-0.5">Manage and track all your quotations.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E8E8E8]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-base md:text-lg font-semibold text-[#1A1A1A]">
            All Quotations
            {!loading && <span className="ml-2 text-sm font-normal text-[#1A1A1A]/40">({quotations.length})</span>}
          </h2>
          {isSuperAdmin && (
            <Button asChild className="rounded-lg bg-[#5A378F] hover:bg-[#4a2d7a] text-white gap-2">
              <Link href="/dashboard/quotations/create">
                <Plus className="h-4 w-4" />New Quotation
              </Link>
            </Button>
          )}
        </div>

        {/* Tabs + Search */}
        <div className="flex items-center justify-between px-5 pb-3 gap-4 flex-wrap border-b border-[#F0F0F0]">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const count = tabCounts[tab.key];
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm md:text-base font-medium transition-colors ${isActive ? "text-[#1A1A1A]" : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60"
                    }`}
                >
                  {tab.label}
                  {tab.key !== "all" && count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold leading-none ${isActive ? "bg-[#5A378F] text-white" : TAB_BADGE[tab.key]
                      }`}>{count}</span>
                  )}
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A378F] rounded-full" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1A1A1A]/30 pointer-events-none" />
              <input
                type="text" placeholder="Search..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm border border-[#E8E8E8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A378F]/20 focus:border-[#5A378F]/40 w-48 bg-[#F0F0F0]/50 text-[#1A1A1A] placeholder:text-[#1A1A1A]/30"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-[#E8E8E8] rounded-lg text-sm text-[#1A1A1A]/60 hover:bg-[#F0F0F0] transition-colors">
              <SlidersHorizontal className="h-4 w-4" /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div>
          {loading ? (
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="bg-[#F0F0F0]/60 border-t border-[#E8E8E8]">
                  {["", "Quotation ID", "Client", "Email", "Date", "Amount", "Status", ""].map((h, i) => (
                    <th key={i} className="px-3 py-3 first:pl-5 last:pr-5">
                      {h && <Skeleton className="h-3 w-16" />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {[
                  ["w-4", "w-20", "w-28", "w-32", "w-20", "w-16", "w-14", "w-16"],
                  ["w-4", "w-24", "w-24", "w-36", "w-20", "w-16", "w-16", "w-16"],
                  ["w-4", "w-20", "w-32", "w-28", "w-20", "w-12", "w-14", "w-16"],
                  ["w-4", "w-24", "w-20", "w-32", "w-20", "w-16", "w-16", "w-16"],
                  ["w-4", "w-20", "w-28", "w-24", "w-20", "w-14", "w-14", "w-16"],
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
            <div className="py-20 text-center text-[#1A1A1A]/30 text-sm md:text-base">No quotations found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F0F0F0]/60 border-t border-[#E8E8E8]">
                  <th className="pl-5 pr-3 py-3 w-10">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll}
                      className="rounded border-[#E8E8E8] accent-[#5A378F] cursor-pointer" />
                  </th>
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center gap-1 text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">
                      Quotation ID <SortBtn field="invoiceNumber" active={sortField} dir={sortDir} onClick={() => handleSort("invoiceNumber")} />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center gap-1 text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">
                      Client <SortBtn field="clientName" active={sortField} dir={sortDir} onClick={() => handleSort("clientName")} />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">Email</th>
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center gap-1 text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">
                      Date <SortBtn field="date" active={sortField} dir={sortDir} onClick={() => handleSort("date")} />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center gap-1 text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">
                      Amount <SortBtn field="total" active={sortField} dir={sortDir} onClick={() => handleSort("total")} />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">Status</th>
                  <th className="pr-6 pl-3 py-3 text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {filtered.map((q, index) => {
                  const badge = STATUS_BADGE[q.status] ?? { label: q.status, className: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={q._id} className={`transition-colors hover:bg-[#F0F0F0]/40 ${selected.has(q._id) ? "bg-[#EEEDFE]/30" : ""}`}>
                      <td className="pl-6 pr-3 py-4">
                        <input type="checkbox" checked={selected.has(q._id)} onChange={() => toggleSelect(q._id)}
                          className="rounded border-[#E8E8E8] accent-[#5A378F] cursor-pointer" />
                      </td>
                      <td className="px-3 py-4 font-semibold text-[#1A1A1A]">{q.invoiceNumber}</td>
                      <td className="px-3 py-4 text-[#1A1A1A]/70">{q.to.name}</td>
                      <td className="px-3 py-4 text-[#1A1A1A]/50">{q.to.email ? `@${q.to.email}` : "—"}</td>
                      <td className="px-3 py-4 text-[#1A1A1A]/70">{format(new Date(q.date), "dd MMM, yyyy")}</td>
                      <td className="px-3 py-4 font-semibold text-[#51B9A9]">৳{q.total.toLocaleString("en-BD")}</td>

                      <td className="px-3 py-4">
                        {isSuperAdmin ? (
                          <div className="relative inline-block">
                            {(() => {
                              const style = SELECT_CLASS[q.status] ?? "bg-gray-100 text-gray-600";
                              const textColor = style.split(" ").find(c => c.startsWith("text-")) || "text-gray-600";

                              return (
                                <>
                                  <select
                                    value={q.status}
                                    onChange={(e) => handleStatusChange(q._id, e.target.value)}
                                    className={`appearance-none text-xs font-semibold px-2.5 py-1 pr-8 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5A378F]/30 ${style}`}
                                  >
                                    <option value="Paid">Paid</option>
                                    <option value="Unpaid">Due</option>
                                    <option value="Hold">Hold</option>
                                    <option value="Cancelled">Cancel</option>
                                  </select>

                                  <ChevronDown
                                    size={14}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${textColor}`}
                                  />
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        )}
                      </td>

                      <td className="pr-6 pl-3 py-4">
                        <div className="flex items-center gap-0.5 justify-end">
                          <Link href={`/dashboard/quotations/${q._id}`}>
                            <button title="Preview" className="p-1.5 rounded-lg hover:bg-[#F0F0F0] transition-colors">
                              <Eye className="h-4 w-4 text-[#1A1A1A]/50" />
                            </button>
                          </Link>
                          {isSuperAdmin && (
                            <Link href={`/dashboard/quotations/${q._id}/edit`}>
                              <button title="Edit" className="p-1.5 rounded-lg hover:bg-[#F0F0F0] transition-colors">
                                <Edit className="h-4 w-4 text-[#1A1A1A]/50" />
                              </button>
                            </Link>
                          )}
                          {isSuperAdmin && (
                            <RowMenu
                              onDraft={() => handleStatusChange(q._id, "Hold")}
                              onDelete={() => setDeleteTarget(q)}
                              isDeleting={deletingId === q._id}
                              openUp={index !== 0}
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
          <div className="px-5 py-3 border-t border-[#F0F0F0] text-xs md:text-sm text-[#1A1A1A]/40 flex items-center justify-between">
            <span>Showing {filtered.length} of {quotations.length} quotation{quotations.length !== 1 ? "s" : ""}</span>
            {selected.size > 0 && <span className="text-[#5A378F] font-semibold">{selected.size} selected</span>}
          </div>
        )}
      </div>
    </div>
  );
}
