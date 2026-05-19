"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Trash2, RotateCcw, FileText, ContactRound, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type TrashInvoice = {
  _id: string;
  invoiceNumber: string;
  name: string;
  type: "invoice" | "invoice2" | "quotation" | "receipt";
  to: { name: string };
  total: number;
  deletedAt: string;
};

type TrashClient = {
  _id: string;
  name: string;
  companyName?: string;
  email?: string;
  deletedAt: string;
};

type TabKey = "all" | "invoice" | "invoice2" | "receipt" | "quotation" | "client";

const TYPE_LABEL: Record<string, string> = {
  invoice:   "Invoice",
  invoice2:  "Invoice Services",
  quotation: "Quotation",
  receipt:   "Receipt",
  client:    "Client",
};

const TYPE_COLOR: Record<string, string> = {
  invoice:   "bg-indigo-100 text-indigo-700",
  invoice2:  "bg-blue-100 text-blue-700",
  quotation: "bg-yellow-100 text-yellow-700",
  receipt:   "bg-green-100 text-green-700",
  client:    "bg-purple-100 text-purple-700",
};

function PurgeModal({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  itemName?: string;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold text-gray-900">
                Delete Permanently
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-gray-500 leading-relaxed">
                {itemName ? (
                  <>
                    <span className="font-semibold text-gray-700">&ldquo;{itemName}&rdquo;</span> will be permanently deleted and{" "}
                  </>
                ) : (
                  "This item will be permanently deleted and "
                )}
                <span className="font-semibold text-red-600">cannot be recovered.</span> Are you sure?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            {isDeleting ? "Deleting…" : "Delete Forever"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TrashPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "Super Admin";

  const [invoices, setInvoices]   = useState<TrashInvoice[]>([]);
  const [clients, setClients]     = useState<TrashClient[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const [restoringId, setRestoringId]   = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget]   = useState<{ id: string; name: string; kind: "invoice" | "client" } | null>(null);
  const [isPurging, setIsPurging]       = useState(false);
  const [emptyConfirm, setEmptyConfirm] = useState(false);
  const [isEmptying, setIsEmptying]     = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/trash")
      .then((r) => r.json())
      .then((data) => {
        if (data.invoices) setInvoices(data.invoices);
        if (data.clients)  setClients(data.clients);
      })
      .catch(() => toast.error("Failed to load trash"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRestore = async (id: string, kind: "invoice" | "client") => {
    setRestoringId(id);
    try {
      const url = kind === "invoice" ? `/api/invoices/${id}` : `/api/clients/${id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted: false, deletedAt: null }),
      });
      if (res.ok) {
        if (kind === "invoice") setInvoices((p) => p.filter((i) => i._id !== id));
        else                    setClients((p)  => p.filter((c) => c._id !== id));
        toast.success("Item restored successfully");
      } else {
        toast.error("Failed to restore");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setRestoringId(null);
    }
  };

  const handlePurge = async () => {
    if (!purgeTarget) return;
    setIsPurging(true);
    try {
      const { id, kind } = purgeTarget;
      const url = kind === "invoice"
        ? `/api/invoices/${id}?permanent=true`
        : `/api/clients/${id}?permanent=true`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        if (kind === "invoice") setInvoices((p) => p.filter((i) => i._id !== id));
        else                    setClients((p)  => p.filter((c) => c._id !== id));
        setPurgeTarget(null);
        toast.success("Permanently deleted");
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsPurging(false);
    }
  };

  const handleEmptyTrash = async () => {
    setIsEmptying(true);
    try {
      await Promise.all([
        ...invoices.map((i) => fetch(`/api/invoices/${i._id}?permanent=true`, { method: "DELETE" })),
        ...clients.map((c) => fetch(`/api/clients/${c._id}?permanent=true`, { method: "DELETE" })),
      ]);
      setInvoices([]);
      setClients([]);
      setEmptyConfirm(false);
      toast.success("Trash emptied");
    } catch {
      toast.error("Failed to empty trash");
    } finally {
      setIsEmptying(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    if (activeTab === "all" || activeTab === "client") return invoices;
    return invoices.filter((i) => i.type === activeTab);
  }, [invoices, activeTab]);

  const filteredClients = useMemo(() => {
    if (activeTab === "all" || activeTab === "client") return clients;
    return [];
  }, [clients, activeTab]);

  const totalCount = invoices.length + clients.length;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "invoice",   label: "Invoices" },
    { key: "invoice2",  label: "Invoice Services" },
    { key: "receipt",   label: "Receipts" },
    { key: "quotation", label: "Quotations" },
    { key: "client",    label: "Clients" },
  ];

  const tabCount = (key: TabKey) => {
    if (key === "all")    return totalCount;
    if (key === "client") return clients.length;
    return invoices.filter((i) => i.type === key).length;
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Trash2 className="w-12 h-12 text-gray-200 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Access Restricted</h2>
        <p className="text-sm text-gray-400 mt-1">Only Super Admins can access the Trash.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PurgeModal
        open={!!purgeTarget}
        onOpenChange={(v) => { if (!v) setPurgeTarget(null); }}
        itemName={purgeTarget?.name}
        onConfirm={handlePurge}
        isDeleting={isPurging}
      />

      <PurgeModal
        open={emptyConfirm}
        onOpenChange={setEmptyConfirm}
        itemName={undefined}
        onConfirm={handleEmptyTrash}
        isDeleting={isEmptying}
      />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-gray-500" />
            Trash
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Items here are moved to trash. Restore or permanently delete them.
          </p>
        </div>
        {totalCount > 0 && (
          <Button
            variant="outline"
            onClick={() => setEmptyConfirm(true)}
            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Empty Trash
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => {
            const count    = tabCount(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold leading-none ${
                    isActive ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                  }`}>{count}</span>
                )}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-8 w-20 rounded-xl" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredInvoices.length === 0 && filteredClients.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-700">Trash is empty</h3>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === "all"
                ? "No items in trash. Deleted items will appear here."
                : `No deleted ${TYPE_LABEL[activeTab]?.toLowerCase() ?? "items"} found.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Invoice rows */}
            {filteredInvoices.map((item) => (
              <div key={item._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{item.invoiceNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[item.type] ?? "bg-gray-100 text-gray-600"}`}>
                      {TYPE_LABEL[item.type] ?? item.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {item.to?.name && <span className="mr-2">{item.to.name}</span>}
                    Deleted {item.deletedAt ? format(new Date(item.deletedAt), "MMM dd, yyyy 'at' h:mm a") : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(item._id, "invoice")}
                    disabled={restoringId === item._id}
                    className="rounded-xl gap-1.5 text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300"
                  >
                    {restoringId === item._id
                      ? <Spinner className="h-3.5 w-3.5" />
                      : <RotateCcw className="h-3.5 w-3.5" />}
                    Restore
                  </Button>
                  <button
                    onClick={() => setPurgeTarget({ id: item._id, name: item.invoiceNumber, kind: "invoice" })}
                    disabled={restoringId === item._id}
                    className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    title="Delete forever"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Client rows */}
            {(activeTab === "all" || activeTab === "client") && filteredClients.map((client) => (
              <div key={client._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <ContactRound className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{client.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR.client}`}>
                      Client
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {client.email && <span className="mr-2">{client.email}</span>}
                    Deleted {client.deletedAt ? format(new Date(client.deletedAt), "MMM dd, yyyy 'at' h:mm a") : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(client._id, "client")}
                    disabled={restoringId === client._id}
                    className="rounded-xl gap-1.5 text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300"
                  >
                    {restoringId === client._id
                      ? <Spinner className="h-3.5 w-3.5" />
                      : <RotateCcw className="h-3.5 w-3.5" />}
                    Restore
                  </Button>
                  <button
                    onClick={() => setPurgeTarget({ id: client._id, name: client.name, kind: "client" })}
                    disabled={restoringId === client._id}
                    className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    title="Delete forever"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && totalCount > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 text-xs text-gray-400">
            {totalCount} item{totalCount !== 1 ? "s" : ""} in trash
          </div>
        )}
      </div>
    </div>
  );
}
