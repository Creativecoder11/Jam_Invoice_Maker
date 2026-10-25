"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Plus, Search, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
  MoreHorizontal, Eye, Edit, Trash2, ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { InvoiceFormData } from "@/types/invoice";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";

type Invoice = InvoiceFormData & { _id: string; createdAt: string };
type SortField = "invoiceNumber" | "clientName" | "date" | "total";
type SortDir = "asc" | "desc";
type TabFilter = "all" | "Unpaid" | "Paid" | "Hold" | "Cancelled";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  Paid: { label: "Paid", className: "bg-[#E1F5EE] text-[#085041]" },
  Unpaid: { label: "Due", className: "bg-[#EEEDFE] text-[#3C3489]" },
  Hold: { label: "Hold", className: "bg-[#EEEDFE] text-[#3C3489]" },
  Cancelled: { label: "Cancelled", className: "bg-[#FBEAF0] text-[#72243E]" },
};

const SELECT_CLASS: Record<string, string> = {
  Paid: "bg-[#E1F5EE] text-[#085041]",
  Unpaid: "bg-[#EEEDFE] text-[#3C3489]",
  Hold: "bg-[#EEEDFE] text-[#3C3489]",
  Cancelled: "bg-[#FBEAF0] text-[#72243E]",
};

const TAB_BADGE: Record<string, string> = {
  Unpaid: "bg-[#EEEDFE] text-[#3C3489]",
  Paid: "bg-[#E1F5EE] text-[#085041]",
  Hold: "bg-[#FFF8E1] text-[#7A5C00]",
  Cancelled: "bg-[#FBEAF0] text-[#72243E]",
};

// ── 3-dot Row Menu ─────────────────────────────────────────────────────────────
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
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="p-1.5 rounded-lg hover:bg-[#F0F0F0] transition-colors">
        <MoreHorizontal className="h-4 w-4 text-[#1A1A1A]/30" />
      </button>
      {open && (
        <div
          className={`absolute right-0 ${openUp
            ? "bottom-full mb-1"
            : "top-full -mt-3"
            } w-40 bg-white border border-[#E8E8E8] rounded-xl shadow-xl z-50`}
        >
          <button
            onClick={() => { onDraft(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#1A1A1A]/70 hover:bg-[#F0F0F0] text-left"
          >
            <Edit className="h-3.5 w-3.5 text-[#1A1A1A]/60" />
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

// ── Sort button ────────────────────────────────────────────────────────────────
function SortBtn({ field, active, dir, onClick }: { field: SortField; active: SortField; dir: SortDir; onClick: () => void }) {
  const Icon = active !== field ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button onClick={onClick} className="flex items-center gap-0.5 group">
      <Icon className={`h-3 w-3 ${active === field ? "text-[#5A378F]" : "text-[#1A1A1A]/20 group-hover:text-[#1A1A1A]/40"}`} />
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "Super Admin";

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  useEffect(() => {
    fetch("/api/invoices?type=invoice")
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json();
          throw new Error(err.message || "Failed to fetch");
        }
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setInvoices(data);
        else console.error("Expected array, got:", data);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        toast.error("Failed to load invoices: " + err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setInvoices((prev) => prev.map((i) => i._id === id ? { ...i, status: status as any } : i));
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) toast.error("Failed to update status");
    } catch { toast.error("An error occurred"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInvoices((prev) => prev.filter((i) => i._id !== id));
        setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
        setDeleteTarget(null);
        toast.success("Invoice moved to trash");
      } else { toast.error("Failed to delete invoice"); }
    } catch { toast.error("An error occurred"); }
    finally { setDeletingId(null); }
  };

  const tabCounts = useMemo(() => ({
    all: invoices.length,
    Unpaid: invoices.filter((i) => i.status === "Unpaid").length,
    Paid: invoices.filter((i) => i.status === "Paid").length,
    Hold: invoices.filter((i) => i.status === "Hold").length,
    Cancelled: invoices.filter((i) => i.status === "Cancelled").length,
  }), [invoices]);

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
      else if (sortField === "date") { va = new Date(a.date).getTime(); vb = new Date(b.date).getTime(); }
      else if (sortField === "total") { va = a.total; vb = b.total; }
      else { va = a.invoiceNumber; vb = b.invoiceNumber; }
      if (typeof va === "string")
        return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === "asc" ? va - (vb as number) : (vb as number) - va;
    });
    return list;
  }, [invoices, activeTab, search, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(filtered.map((i) => i._id)));

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "Unpaid", label: "Due" },
    { key: "Paid", label: "Paid" },
    { key: "Hold", label: "Hold" },
    { key: "Cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-5">
      <DeleteConfirmModal
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        itemName={deleteTarget?.invoiceNumber}
        itemLabel="invoice"
        onConfirm={handleDelete}
        isDeleting={!!deletingId}
      />

      {/* Page title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">Invoices</h1>
        <p className="text-sm md:text-base text-[#1A1A1A]/60 mt-0.5">Manage and track all your invoices.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E8E8E8]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-base md:text-lg font-semibold text-[#1A1A1A]">
            All Invoices
            {!loading && (
              <span className="ml-2 text-sm font-normal text-[#1A1A1A]/40">({invoices.length})</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Button asChild className="rounded-lg bg-[#5A378F] hover:bg-[#4a2d7a] text-white gap-2">
                <Link href="/dashboard/invoices/create">
                  <Plus className="h-4 w-4" />New Invoice
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="flex items-center justify-between px-5 pb-3 gap-4 flex-wrap border-b border-[#F0F0F0]">
          <div className="flex items-center gap-0.5">
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
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm border border-[#E8E8E8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A378F]/20 focus:border-[#5A378F]/40 w-48 bg-[#F0F0F0]/50 text-[#1A1A1A] placeholder:text-[#1A1A1A]/30"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-[#E8E8E8] rounded-lg text-sm text-[#1A1A1A]/60 hover:bg-[#F0F0F0] transition-colors">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto overflow-y-visible">
          {loading ? (
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="bg-[#F0F0F0]/60 border-t border-[#E8E8E8]">
                  {["", "Invoice ID", "Client", "Email", "Date", "Amount", "Status", ""].map((h, i) => (
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
                  ["w-4", "w-24", "w-24", "w-36", "w-20", "w-16", "w-16", "w-16"],
                ].map((widths, ri) => (
                  <tr key={ri}>
                    {widths.map((w, ci) => (
                      <td key={ci} className="px-3 py-4 first:pl-5 last:pr-5">
                        <Skeleton className={`h-4 ${w}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-[#1A1A1A]/30 text-sm md:text-base">No invoices found.</div>
          ) : (
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="bg-[#F0F0F0]/60 border-t border-[#E8E8E8]">
                  <th className="pl-5 pr-3 py-3 w-10">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll}
                      className="rounded border-[#E8E8E8] accent-[#5A378F] cursor-pointer" />
                  </th>
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center gap-1 text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">
                      Invoice ID <SortBtn field="invoiceNumber" active={sortField} dir={sortDir} onClick={() => handleSort("invoiceNumber")} />
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
                  <th className="pr-5 pl-3 py-3 min-w-[160px] text-xs md:text-sm font-semibold text-[#1A1A1A]/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {filtered.map((inv, index) => {
                  const badge = STATUS_BADGE[inv.status] ?? { label: inv.status, className: "bg-[#F0F0F0] text-[#1A1A1A]/60" };
                  return (
                    <tr
                      key={inv._id}
                      className={`relative transition-colors hover:bg-[#F0F0F0]/40 ${selected.has(inv._id) ? "bg-[#EEEDFE]/30" : ""
                        }`}
                    >
                      <td className="pl-5 pr-3 py-4">
                        <input type="checkbox" checked={selected.has(inv._id)} onChange={() => toggleSelect(inv._id)}
                          className="rounded border-[#E8E8E8] accent-[#5A378F] cursor-pointer" />
                      </td>
                      <td className="px-3 py-4 font-semibold text-[#1A1A1A]">{inv.invoiceNumber}</td>
                      <td className="px-3 py-4 text-[#1A1A1A]/70">{inv.to.name}</td>
                      <td className="px-3 py-4 text-[#1A1A1A]/50">{inv.to.email ? `@${inv.to.email}` : "—"}</td>
                      <td className="px-3 py-4 text-[#1A1A1A]/70">{format(new Date(inv.date), "dd MMM, yyyy")}</td>
                      <td className="px-3 py-4 font-semibold text-[#51B9A9]">৳{inv.total.toLocaleString("en-BD")}</td>

                      {/* Status */}
                      <td className="px-3 py-4">
                        {isSuperAdmin ? (
                          <div className="relative inline-block">
                            {(() => {
                              const style = SELECT_CLASS[inv.status] ?? "bg-[#F0F0F0] text-[#1A1A1A]/60";
                              const textColor = style.split(" ").find(c => c.startsWith("text-")) || "text-[#1A1A1A]/60";
                              return (
                                <>
                                  <select
                                    value={inv.status}
                                    onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                                    className={`appearance-none text-xs font-semibold px-2.5 py-1 pr-8 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5A378F]/30 ${style}`}
                                  >
                                    <option value="Paid">Paid</option>
                                    <option value="Unpaid">Due</option>
                                    <option value="Hold">Hold</option>
                                    <option value="Cancelled">Cancel</option>
                                  </select>
                                  <ChevronDown size={14} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${textColor}`} />
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="relative pr-5 pl-3 py-4 overflow-visible">
                        <div className="flex items-center gap-0.5 justify-end">
                          <Link href={`/dashboard/invoices/${inv._id}`}>
                            <button title="Preview" className="p-1.5 rounded-lg hover:bg-[#F0F0F0] transition-colors">
                              <Eye className="h-4 w-4 text-[#1A1A1A]/60" />
                            </button>
                          </Link>
                          {isSuperAdmin && (
                            <Link href={`/dashboard/invoices/${inv._id}/edit`}>
                              <button title="Edit" className="p-1.5 rounded-lg hover:bg-[#F0F0F0] transition-colors">
                                <Edit className="h-4 w-4 text-[#1A1A1A]/60" />
                              </button>
                            </Link>
                          )}
                          {isSuperAdmin && (
                            <RowMenu
                              onDraft={() => handleStatusChange(inv._id, "Hold")}
                              onDelete={() => setDeleteTarget(inv)}
                              isDeleting={deletingId === inv._id}
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

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="relative z-0 px-5 py-3 border-t border-[#F0F0F0] bg-white text-xs md:text-sm text-[#1A1A1A]/40 flex items-center justify-between">
            <span>
              Showing {filtered.length} of {invoices.length} invoice
              {invoices.length !== 1 ? "s" : ""}
            </span>

            {selected.size > 0 && (
              <span className="text-[#5A378F] font-semibold">
                {selected.size} selected
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}