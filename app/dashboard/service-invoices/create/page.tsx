"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, Plus, Search, X, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { ServiceInvoicePreview } from "@/components/ServiceInvoicePreview";
import { ServiceInvoiceFormData, ServiceGroup, ServiceItem } from "@/types/invoice";
import { Spinner } from "@/components/ui/spinner";

// ── Quick-Add Client Dialog ───────────────────────────────────────────────────
function AddClientDialog({ onSave, onClose }: { onSave: (c: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", companyName: "", email: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (res.ok) { toast.success("Client saved"); onSave(json); }
      else toast.error(json.message || "Failed to save");
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E8E8E8] w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F0F0F0]">
          <h3 className="font-semibold text-[#1A1A1A]">Add New Client</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F0F0F0] transition-colors"><X className="h-4 w-4 text-[#1A1A1A]/40" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Name <span className="text-[#EA2B7B]">*</span></Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Doe" /></div>
            <div className="space-y-1.5"><Label>Company Name</Label><Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Acme Corp" /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@example.com" /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 234 567 890" /></div>
            <div className="space-y-1.5 col-span-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St, City" rows={2} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 pb-5">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving} className="rounded-lg border-[#E8E8E8] hover:bg-[#F0F0F0]">Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !form.name.trim()} className="rounded-lg bg-[#5A378F] hover:bg-[#4a2d7a] text-white">
            {saving ? <Spinner className="h-3.5 w-3.5 mr-1.5" /> : <UserPlus className="h-3.5 w-3.5 mr-1.5" />} Save & Use
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Client Search Dropdown ────────────────────────────────────────────────────
function ClientSearch({ clients, onSelect, onAddNew }: { clients: any[]; onSelect: (c: any) => void; onAddNew: () => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = query.trim() ? clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.email?.toLowerCase().includes(query.toLowerCase())) : clients;

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input className="pl-9" placeholder="Search preset clients…" value={query} onFocus={() => setOpen(true)} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} />
      </div>
      {open && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-[#E8E8E8] rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filtered.length === 0 && query.trim() && <p className="px-4 py-3 text-sm text-[#1A1A1A]/40">No clients found.</p>}
          {filtered.map((c) => (
            <button key={c._id} type="button" onClick={() => { onSelect(c); setQuery(""); setOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-[#EEEDFE]/50 transition-colors border-b border-[#F0F0F0] last:border-0">
              <p className="text-sm font-semibold text-[#1A1A1A]">{c.name}</p>
              {(c.companyName || c.email) && <p className="text-xs text-[#1A1A1A]/40 mt-0.5">{[c.companyName, c.email].filter(Boolean).join(" · ")}</p>}
            </button>
          ))}
          <button type="button" onClick={() => { setOpen(false); onAddNew(); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#5A378F] hover:bg-[#EEEDFE]/50 transition-colors font-medium border-t border-[#F0F0F0]">
            <UserPlus className="h-4 w-4" /> Add new client
          </button>
        </div>
      )}
    </div>
  );
}

// ── Service Card ──────────────────────────────────────────────────────────────
function ServiceCard({
  service, serviceIdx, onUpdateName, onAddItem, onUpdateItem, onRemoveItem,
  onAddSubItem, onUpdateSubItem, onRemoveSubItem, onRemoveService,
}: {
  service: ServiceGroup;
  serviceIdx: number;
  onUpdateName: (v: string) => void;
  onAddItem: () => void;
  onUpdateItem: (ii: number, f: string, v: string | number) => void;
  onRemoveItem: (ii: number) => void;
  onAddSubItem: (ii: number) => void;
  onUpdateSubItem: (ii: number, si: number, v: string) => void;
  onRemoveSubItem: (ii: number, si: number) => void;
  onRemoveService: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const subtotal = service.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <div className="border border-[#E8E8E8] rounded-xl overflow-hidden">
      {/* Service header */}
      <div className="flex items-center justify-between bg-[#EEEDFE]/60 px-4 py-3 gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-bold text-[#5A378F] shrink-0">Service {serviceIdx + 1}</span>
          <Input
            value={service.serviceName}
            onChange={(e) => onUpdateName(e.target.value)}
            placeholder="e.g. Graphics Design Service"
            className="h-8 text-sm font-semibold border-[#AFA9EC]/40 focus:ring-[#5A378F]/20 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#5A378F] bg-[#EEEDFE] px-2 py-1 rounded-full">
            ${subtotal.toFixed(2)}
          </span>
          <button onClick={() => setCollapsed((c) => !c)} className="p-1 rounded hover:bg-[#EEEDFE] transition-colors">
            {collapsed ? <ChevronDown className="h-4 w-4 text-[#5A378F]/60" /> : <ChevronUp className="h-4 w-4 text-purple-500" />}
          </button>
          <button onClick={onRemoveService} className="p-1 rounded hover:bg-[#FBEAF0] transition-colors">
            <Trash2 className="h-4 w-4 text-[#EA2B7B]" />
          </button>
        </div>
      </div>

      {/* Items */}
      {!collapsed && (
        <div className="p-4 space-y-4 bg-white">
          {service.items.map((item, ii) => (
            <div key={ii} className="border border-[#F0F0F0] rounded-lg p-3 space-y-3 bg-[#F0F0F0]/30">
              {/* Item row */}
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-[#1A1A1A]/60">Description</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => onUpdateItem(ii, "name", e.target.value)}
                    placeholder="Item description"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="w-20 space-y-1">
                  <Label className="text-xs text-[#1A1A1A]/60">Qty</Label>
                  <Input type="number" min={0} value={item.quantity}
                    onChange={(e) => onUpdateItem(ii, "quantity", Number(e.target.value))}
                    className="h-8 text-sm" />
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-xs text-[#1A1A1A]/60">Unit Price</Label>
                  <Input type="number" min={0} step="0.01" value={item.unitPrice}
                    onChange={(e) => onUpdateItem(ii, "unitPrice", Number(e.target.value))}
                    className="h-8 text-sm" />
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs text-[#1A1A1A]/60">Amount</Label>
                  <div className="h-8 flex items-center text-sm font-semibold text-[#51B9A9] px-2 bg-white border border-[#E8E8E8] rounded-md">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#EA2B7B] hover:text-[#c4215f] hover:bg-[#FBEAF0] shrink-0"
                  onClick={() => onRemoveItem(ii)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Note */}
              <div className="space-y-1 pl-1">
                <Label className="text-xs text-[#1A1A1A]/60">Note (optional)</Label>
                <Input placeholder="Add a note for this item..." value={item.note || ""}
                  onChange={(e) => onUpdateItem(ii, "note", e.target.value)}
                  className="h-7 text-xs" />
              </div>

              {/* Sub-items */}
              <div className="space-y-1.5 pl-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[#1A1A1A]/60">Sub-items</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-[#5A378F] hover:bg-[#EEEDFE]/50"
                    onClick={() => onAddSubItem(ii)}>
                    <Plus className="h-3 w-3 mr-1" /> Add sub-item
                  </Button>
                </div>
                {(item.subItems || []).map((sub, si) => (
                  <div key={si} className="flex gap-2 items-center">
                    <span className="text-[#1A1A1A]/30 text-sm">—</span>
                    <Input className="flex-1 h-6 text-xs" placeholder="Sub-item description..."
                      value={sub} onChange={(e) => onUpdateSubItem(ii, si, e.target.value)} />
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-[#EA2B7B] hover:bg-[#FBEAF0]"
                      onClick={() => onRemoveSubItem(ii, si)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add item + service subtotal */}
          <div className="flex items-center justify-between pt-1">
            <Button variant="outline" size="sm" onClick={onAddItem}
              className="h-7 text-xs border-dashed border-[#AFA9EC]/50 text-[#5A378F] hover:bg-[#EEEDFE]/50">
              <Plus className="h-3 w-3 mr-1" /> Add Item
            </Button>
            <div className="text-sm font-semibold text-[#5A378F]">
              Service Subtotal: <span className="text-[#1A1A1A]">${subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const defaultService = (): ServiceGroup => ({
  serviceName: "",
  items: [{ name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }],
});

export default function CreateServiceInvoicePage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingAs, setSavingAs] = useState<string | null>(null);
  const [presetClients, setPresetClients] = useState<any[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);

  const [formData, setFormData] = useState<Partial<ServiceInvoiceFormData>>({
    type: "serviceInvoice",
    status: "Unpaid",
    invoiceNumber: "",
    name: "Invoice",
    date: new Date(),
    dueDate: new Date(),
    from: { name: "", email: "", phone: "", address: "" },
    to: { name: "", email: "", phone: "", address: "" },
    paymentInfo: { accountName: "", accountNumber: "", bankName: "", branch: "", swift: "", routingNumber: "", currency: "BDT" },
    services: [defaultService()],
    vat: 0,
    discount: 0,
    advancePaid: 0,
    total: 0,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      invoiceNumber: "INV2-" + Math.floor(Math.random() * 10000).toString().padStart(4, "0"),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    }));
    fetch("/api/clients").then((r) => r.json()).then((data) => { if (Array.isArray(data)) setPresetClients(data); }).catch(() => { });
  }, []);

  // ── Computed totals ─────────────────────────────────────────────────────────
  const grandSubtotal = (formData.services || []).reduce((s, svc) => s + svc.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0), 0);
  const totalAmount = (grandSubtotal - (formData.discount || 0)) * (1 + (formData.vat || 0) / 100) - (formData.advancePaid || 0);
  if (formData.total !== totalAmount) setFormData((p) => ({ ...p, total: totalAmount }));

  // ── Client helpers ──────────────────────────────────────────────────────────
  const applyPresetClient = (client: any) => {
    setFormData((p) => ({ ...p, to: { name: client.name, email: client.email, phone: client.phone, address: client.address } }));
    toast.success(`Loaded "${client.name}"`);
  };
  const handleNewClientSaved = (client: any) => {
    setPresetClients((p) => [...p, client].sort((a, b) => a.name.localeCompare(b.name)));
    applyPresetClient(client);
    setShowAddClient(false);
  };

  // ── Service helpers ─────────────────────────────────────────────────────────
  const updateServices = (fn: (prev: ServiceGroup[]) => ServiceGroup[]) =>
    setFormData((p) => ({ ...p, services: fn([...(p.services || [])]) }));

  const addService = () => updateServices((s) => [...s, defaultService()]);
  const removeService = (si: number) => updateServices((s) => s.filter((_, i) => i !== si));
  const updateServiceName = (si: number, v: string) =>
    updateServices((s) => { s[si] = { ...s[si], serviceName: v }; return s; });

  const addItem = (si: number) =>
    updateServices((s) => { s[si] = { ...s[si], items: [...s[si].items, { name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }] }; return s; });
  const removeItem = (si: number, ii: number) =>
    updateServices((s) => { const items = [...s[si].items]; items.splice(ii, 1); s[si] = { ...s[si], items }; return s; });
  const updateItem = (si: number, ii: number, f: string, v: string | number) =>
    updateServices((s) => { const items = [...s[si].items]; items[ii] = { ...items[ii], [f]: v }; s[si] = { ...s[si], items }; return s; });

  const addSubItem = (si: number, ii: number) =>
    updateServices((s) => { const items = [...s[si].items]; items[ii] = { ...items[ii], subItems: [...(items[ii].subItems || []), ""] }; s[si] = { ...s[si], items }; return s; });
  const updateSubItem = (si: number, ii: number, subI: number, v: string) =>
    updateServices((s) => { const items = [...s[si].items]; const subs = [...(items[ii].subItems || [])]; subs[subI] = v; items[ii] = { ...items[ii], subItems: subs }; s[si] = { ...s[si], items }; return s; });
  const removeSubItem = (si: number, ii: number, subI: number) =>
    updateServices((s) => { const items = [...s[si].items]; const subs = [...(items[ii].subItems || [])]; subs.splice(subI, 1); items[ii] = { ...items[ii], subItems: subs }; s[si] = { ...s[si], items }; return s; });

  // ── Other helpers ───────────────────────────────────────────────────────────
  const updateTo = (f: string, v: string) => setFormData((p) => ({ ...p, to: { ...p.to!, [f]: v } }));
  const updateFrom = (f: string, v: string) => setFormData((p) => ({ ...p, from: { ...p.from!, [f]: v } }));
  const updatePayment = (f: string, v: string) => setFormData((p) => ({ ...p, paymentInfo: { ...p.paymentInfo!, [f]: v } }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) { setFormData((p) => ({ ...p, logoUrl: data.url })); toast.success("Logo uploaded"); }
      else toast.error(data.message || "Upload failed");
    } catch { toast.error("Upload error"); }
    finally { setUploadingLogo(false); }
  };

  const handleSave = async (status: "Paid" | "Unpaid" | "Hold") => {
    setLoading(true);
    setSavingAs(status);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status }),
      });
      if (res.ok) {
        toast.success(`Invoice saved as ${status}`);
        router.push("/dashboard/service-invoices");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to save invoice");
      }
    } catch { toast.error("An error occurred"); }
    finally { setLoading(false); setSavingAs(null); }
  };

  return (
    <>
      {showAddClient && <AddClientDialog onSave={handleNewClientSaved} onClose={() => setShowAddClient(false)} />}
      <div className="flex flex-col xl:flex-row gap-4">

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <div className="w-full md:w-1/2 space-y-6 rounded-xl border border-[#E8E8E8] p-6 bg-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">Create Service Invoice</h1>
            <div className="flex gap-2">
              <Button className="bg-[#FFF8E1] hover:bg-[#F9C551]/30 text-[#7A5C00] border border-[#F9C551]/40 rounded-lg" onClick={() => handleSave("Hold")} disabled={loading}>
                {savingAs === "Hold" && <Spinner className="mr-2 h-3.5 w-3.5" />} Save Hold
              </Button>
              <Button className="bg-[#EEEDFE] hover:bg-[#AFA9EC]/30 text-[#3C3489] border border-[#AFA9EC]/40 rounded-lg" onClick={() => handleSave("Unpaid")} disabled={loading}>
                {savingAs === "Unpaid" && <Spinner className="mr-2 h-3.5 w-3.5" />} Save Unpaid
              </Button>
              <Button className="bg-[#E1F5EE] hover:bg-[#51B9A9]/30 text-[#085041] border border-[#51B9A9]/40 rounded-lg" onClick={() => handleSave("Paid")} disabled={loading}>
                {savingAs === "Paid" && <Spinner className="mr-2 h-3.5 w-3.5" />} Save Paid
              </Button>
            </div>
          </div>

          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-[#F0F0F0] rounded-lg p-1">
              <TabsTrigger value="details" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm text-[#1A1A1A]/50 text-sm font-medium"
              >Details</TabsTrigger>
              <TabsTrigger value="client" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm text-[#1A1A1A]/50 text-sm font-medium"
              >Client</TabsTrigger>
              <TabsTrigger value="services" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm text-[#1A1A1A]/50 text-sm font-medium"
              >Services</TabsTrigger>
              <TabsTrigger value="payment" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm text-[#1A1A1A]/50 text-sm font-medium"
              >Payment</TabsTrigger>
            </TabsList>

            {/* ── Details ─────────────────────────────────────────────────── */}
            <TabsContent value="details" className="space-y-4 pt-4">
              <Card className="rounded-xl border border-[#E8E8E8] shadow-none">
                <CardHeader><CardTitle className="text-base font-semibold text-[#1A1A1A]">Invoice Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Invoice Number</Label>
                      <Input value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Document Name</Label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Date</Label>
                      <Input type="date" value={formData.date ? new Date(formData.date).toISOString().split("T")[0] : ""}
                        onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })} /></div>
                    <div className="space-y-2"><Label>Due Date</Label>
                      <Input type="date" value={formData.dueDate ? new Date(formData.dueDate).toISOString().split("T")[0] : ""}
                        onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value) })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Logo</Label>
                    <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                    {uploadingLogo && <p className="text-xs text-[#1A1A1A]/40 flex items-center gap-1.5"><Spinner className="h-3 w-3" /> Uploading…</p>}
                  </div>
                  <div className="pt-4 border-t space-y-4">
                    <h3 className="font-semibold text-sm text-[#1A1A1A]/60">Your Company (From)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Company Name</Label><Input value={formData.from?.name} onChange={(e) => updateFrom("name", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Email</Label><Input value={formData.from?.email} onChange={(e) => updateFrom("email", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Phone</Label><Input value={formData.from?.phone} onChange={(e) => updateFrom("phone", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Address</Label><Textarea value={formData.from?.address} onChange={(e) => updateFrom("address", e.target.value)} /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Client ──────────────────────────────────────────────────── */}
            <TabsContent value="client" className="space-y-4 pt-4">
              <Card className="rounded-xl border border-[#E8E8E8] shadow-none">
                <CardHeader><CardTitle className="text-base font-semibold text-[#1A1A1A]">Client Details (To)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Search Preset Clients</Label>
                    <ClientSearch clients={presetClients} onSelect={applyPresetClient} onAddNew={() => setShowAddClient(true)} />
                    {presetClients.length === 0 && (
                      <p className="text-xs text-[#1A1A1A]/40">No preset clients yet.{" "}
                        <button type="button" onClick={() => setShowAddClient(true)} className="text-[#5A378F] hover:underline">Add one now</button>
                      </p>
                    )}
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-xs text-[#1A1A1A]/40">Or fill in manually:</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Client Name</Label><Input value={formData.to?.name} onChange={(e) => updateTo("name", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Email</Label><Input value={formData.to?.email} onChange={(e) => updateTo("email", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Phone</Label><Input value={formData.to?.phone} onChange={(e) => updateTo("phone", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Address</Label><Textarea value={formData.to?.address} onChange={(e) => updateTo("address", e.target.value)} /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Services ────────────────────────────────────────────────── */}
            <TabsContent value="services" className="space-y-4 pt-4">
              <div className="space-y-4">
                {(formData.services || []).map((svc, si) => (
                  <ServiceCard
                    key={si}
                    service={svc}
                    serviceIdx={si}
                    onUpdateName={(v) => updateServiceName(si, v)}
                    onAddItem={() => addItem(si)}
                    onUpdateItem={(ii, f, v) => updateItem(si, ii, f, v)}
                    onRemoveItem={(ii) => removeItem(si, ii)}
                    onAddSubItem={(ii) => addSubItem(si, ii)}
                    onUpdateSubItem={(ii, subI, v) => updateSubItem(si, ii, subI, v)}
                    onRemoveSubItem={(ii, subI) => removeSubItem(si, ii, subI)}
                    onRemoveService={() => removeService(si)}
                  />
                ))}

                <Button variant="outline" onClick={addService}
                  className="w-full border-dashed border-2 border-[#AFA9EC]/50 text-[#5A378F] hover:bg-[#EEEDFE]/50 hover:border-[#5A378F]/40 h-12">
                  <Plus className="h-4 w-4 mr-2" /> Add Service
                </Button>

                {/* Grand totals summary */}
                <Card className="rounded-xl border border-[#E8E8E8] shadow-none">
                  <CardContent className="pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-[#1A1A1A]/60"><span>Grand Subtotal</span><span>${grandSubtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center gap-4">
                      <Label className="shrink-0">Discount ($)</Label>
                      <Input type="number" step="0.01" value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                        className="w-32 h-7 text-sm text-right" />
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <Label className="shrink-0">VAT (%)</Label>
                      <Input type="number" step="0.1" value={formData.vat}
                        onChange={(e) => setFormData({ ...formData, vat: Number(e.target.value) })}
                        className="w-32 h-7 text-sm text-right" />
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <Label className="shrink-0">Advance Paid</Label>
                      <Input type="number" step="0.01" value={formData.advancePaid}
                        onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })}
                        className="w-32 h-7 text-sm text-right" />
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-2 border-t border-[#F0F0F0]">
                      <span>Total</span><span className="text-[#51B9A9]">${totalAmount.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Payment ─────────────────────────────────────────────────── */}
            <TabsContent value="payment" className="space-y-4 pt-4">
              <Card className="rounded-xl border border-[#E8E8E8] shadow-none">
                <CardHeader><CardTitle className="text-base font-semibold text-[#1A1A1A]">Payment Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Currency</Label><Input value={formData.paymentInfo?.currency} onChange={(e) => updatePayment("currency", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Bank Name</Label><Input value={formData.paymentInfo?.bankName} onChange={(e) => updatePayment("bankName", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Account Name</Label><Input value={formData.paymentInfo?.accountName} onChange={(e) => updatePayment("accountName", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Account Number</Label><Input value={formData.paymentInfo?.accountNumber} onChange={(e) => updatePayment("accountNumber", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Branch</Label><Input value={formData.paymentInfo?.branch} onChange={(e) => updatePayment("branch", e.target.value)} /></div>
                    <div className="space-y-2"><Label>SWIFT / BIC</Label><Input value={formData.paymentInfo?.swift} onChange={(e) => updatePayment("swift", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Routing Number</Label><Input value={formData.paymentInfo?.routingNumber ?? ""} onChange={(e) => updatePayment("routingNumber", e.target.value)} /></div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Live Preview ───────────────────────────────────────────────────── */}
        <div className="w-full xl:w-1/2 flex flex-col items-center pl-0 xl:pl-6">
          <div className="w-full overflow-x-auto bg-[#F0F0F0]/60 p-4 rounded-xl border border-[#E8E8E8] flex justify-center">
            <div className="origin-top scale-[0.6] sm:scale-75 xl:scale-90 transition-transform">
              <ServiceInvoicePreview data={formData} ref={printRef} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
