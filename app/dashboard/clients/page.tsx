"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, X, Check, Building2, Mail, Phone, MapPin } from "lucide-react";
import { ClientData } from "@/types/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

const EMPTY_FORM = { name: "", companyName: "", email: "", phone: "", address: "" };

function ClientForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: typeof EMPTY_FORM;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Name <span className="text-red-500">*</span></Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Doe" />
        </div>
        <div className="space-y-1.5">
          <Label>Company Name</Label>
          <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Acme Corp" />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 234 567 890" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Address</Label>
          <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St, City, Country" rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
        </Button>
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || !form.name.trim()}>
          {saving ? <Spinner className="h-3.5 w-3.5 mr-1.5" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
          Save Client
        </Button>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "Super Admin";

  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setClients(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const handleAdd = async (data: typeof EMPTY_FORM) => {
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        setClients((prev) => [json, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
        setShowAdd(false);
        toast.success("Client added");
      } else {
        toast.error(json.message || "Failed to add client");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id: string, data: typeof EMPTY_FORM) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        setClients((prev) => prev.map((c) => (c._id === id ? json : c)));
        setEditingId(null);
        toast.success("Client updated");
      } else {
        toast.error(json.message || "Failed to update");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this client? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        setClients((prev) => prev.filter((c) => c._id !== id));
        toast.success("Client deleted");
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage preset client info to auto-fill invoices.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-base font-bold text-gray-900">
            All Clients
            {!loading && <span className="ml-2 text-sm font-normal text-gray-400">({clients.length})</span>}
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 w-48 bg-gray-50"
              />
            </div>
            {isSuperAdmin && !showAdd && (
              <Button onClick={() => setShowAdd(true)} className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white">
                <Plus className="mr-2 h-4 w-4" /> Add Client
              </Button>
            )}
          </div>
        </div>

        {/* Add form */}
        {showAdd && isSuperAdmin && (
          <div className="px-6 pb-5 border-b border-gray-100">
            <div className="bg-indigo-50/60 rounded-xl p-5 border border-indigo-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">New Client</h3>
              <ClientForm
                initial={EMPTY_FORM}
                onSave={handleAdd}
                onCancel={() => setShowAdd(false)}
                saving={saving}
              />
            </div>
          </div>
        )}

        {/* Client list */}
        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-5 flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-60" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              {search ? "No clients match your search." : "No clients yet. Add your first client above."}
            </div>
          ) : (
            filtered.map((client) => (
              <div key={client._id} className="px-6 py-5">
                {editingId === client._id ? (
                  <div className="bg-amber-50/60 rounded-xl p-5 border border-amber-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Edit Client</h3>
                    <ClientForm
                      initial={{
                        name: client.name,
                        companyName: client.companyName,
                        email: client.email,
                        phone: client.phone,
                        address: client.address,
                      }}
                      onSave={(data) => handleEdit(client._id, data)}
                      onCancel={() => setEditingId(null)}
                      saving={saving}
                    />
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                        {client.companyName && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                            <Building2 className="h-3 w-3" />{client.companyName}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        {client.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />{client.email}
                          </span>
                        )}
                        {client.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />{client.phone}
                          </span>
                        )}
                        {client.address && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />{client.address}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingId(client._id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(client._id)}
                          disabled={deletingId === client._id}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === client._id
                            ? <Spinner className="h-4 w-4 text-red-400" />
                            : <Trash2 className="h-4 w-4 text-red-400" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
