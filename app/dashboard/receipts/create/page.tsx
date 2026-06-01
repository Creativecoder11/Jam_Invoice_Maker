"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, Plus, Download, ArrowLeft, Search, X, UserPlus } from "lucide-react";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { InvoiceFormData, ReceiptInfo, ReceiptLineItem } from "@/types/invoice";
import { ClientData } from "@/types/client";
import { Spinner } from "@/components/ui/spinner";

const defaultLineItem = (): ReceiptLineItem => ({ invoiceNo: "", description: "", amount: 0 });

// ── Quick-Add Client Dialog ───────────────────────────────────────────────────
function AddClientDialog({ onSave, onClose }: { onSave: (c: ClientData) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", companyName: "", email: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res  = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (res.ok) { toast.success("Client saved"); onSave(json); }
      else toast.error(json.message || "Failed to save");
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Add New Client</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Name <span className="text-red-500">*</span></Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Doe" /></div>
            <div className="space-y-1.5"><Label>Company Name</Label><Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Acme Corp" /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@example.com" /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 234 567 890" /></div>
            <div className="space-y-1.5 col-span-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St, City" rows={2} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 pb-5">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? <Spinner className="h-3.5 w-3.5 mr-1.5" /> : <UserPlus className="h-3.5 w-3.5 mr-1.5" />}
            Save & Use
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Client Search Dropdown ────────────────────────────────────────────────────
function ClientSearch({ clients, onSelect, onAddNew }: { clients: ClientData[]; onSelect: (c: ClientData) => void; onAddNew: () => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? clients.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.companyName.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase())
      )
    : clients;

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input className="pl-9" placeholder="Search preset clients…" value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        />
      </div>
      {open && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filtered.length === 0 && query.trim() && <p className="px-4 py-3 text-sm text-gray-400">No clients found.</p>}
          {filtered.map((c) => (
            <button key={c._id} type="button"
              onClick={() => { onSelect(c); setQuery(""); setOpen(false); }}
              className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <p className="text-sm font-semibold text-gray-900">{c.name}</p>
              {(c.companyName || c.email) && <p className="text-xs text-gray-400 mt-0.5">{[c.companyName, c.email].filter(Boolean).join(" · ")}</p>}
            </button>
          ))}
          <button type="button" onClick={() => { setOpen(false); onAddNew(); }}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium border-t border-gray-100"
          >
            <UserPlus className="h-4 w-4" /> Add new client
          </button>
        </div>
      )}
    </div>
  );
}

const defaultReceiptInfo = (): ReceiptInfo => ({
  currency: "BDT",
  showInvoiceNo: true,
  lineItems: [defaultLineItem()],
  paidAmount: 0,
  receivedAmount: 0,
  paymentMethod: "",
  accountTransferName: "",
  receivedBy: { name: "", designation: "", companyName: "", address: "", mobile: "" },
});

export default function CreateReceiptPage() {
  const router = useRouter();
  const [saving, setSaving]               = useState(false);
  const [downloading, setDownloading]     = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [presetClients, setPresetClients] = useState<ClientData[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);

  const [formData, setFormData] = useState<Partial<InvoiceFormData>>({
    type: "receipt",
    status: "Paid",
    invoiceNumber: "",
    name: "Receipt",
    date: new Date(),
    dueDate: new Date(),
    from: { name: "", email: "", phone: "", address: "" },
    to:   { name: "", email: "", phone: "", address: "" },
    paymentInfo: { accountName: "", accountNumber: "", bankName: "", branch: "", swift: "", currency: "BDT" },
    items: [],
    vat: 0, discount: 0, total: 0,
    receiptInfo: defaultReceiptInfo(),
  });

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPresetClients(data); })
      .catch(() => {});
  }, []);

  const applyPresetClient = (client: ClientData) => {
    setFormData((p) => ({ ...p, to: { name: client.name, email: client.email, phone: client.phone, address: client.address } }));
    toast.success(`Loaded "${client.name}"`);
  };

  const handleNewClientSaved = (client: ClientData) => {
    setPresetClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
    applyPresetClient(client);
    setShowAddClient(false);
  };

  const ri = formData.receiptInfo!;

  const totalDue = useMemo(
    () => (ri.lineItems || []).reduce((s, i) => s + (i.amount || 0), 0),
    [ri.lineItems],
  );

  // helpers
  const updateFrom = (f: string, v: string) => setFormData((p) => ({ ...p, from: { ...p.from!, [f]: v } }));
  const updateTo   = (f: string, v: string) => setFormData((p) => ({ ...p, to:   { ...p.to!,   [f]: v } }));

  const updateRI = (patch: Partial<ReceiptInfo>) =>
    setFormData((p) => ({ ...p, receiptInfo: { ...p.receiptInfo!, ...patch } }));

  const updateReceivedBy = (f: string, v: string) =>
    setFormData((p) => ({ ...p, receiptInfo: { ...p.receiptInfo!, receivedBy: { ...p.receiptInfo!.receivedBy, [f]: v } } }));

  const addLineItem    = () => updateRI({ lineItems: [...ri.lineItems, defaultLineItem()] });
  const removeLineItem = (i: number) => {
    const items = [...ri.lineItems]; items.splice(i, 1); updateRI({ lineItems: items });
  };
  const updateLineItem = (i: number, f: keyof ReceiptLineItem, v: string | number) => {
    const items = [...ri.lineItems]; items[i] = { ...items[i], [f]: v }; updateRI({ lineItems: items });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res  = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) { setFormData((p) => ({ ...p, logoUrl: data.url })); toast.success("Logo uploaded"); }
      else toast.error(data.message || "Upload failed");
    } catch { toast.error("Upload error"); }
    finally { setUploadingLogo(false); }
  };

  const handleSave = async () => {
    if (!formData.invoiceNumber?.trim()) { toast.error("Receipt number is required"); return; }
    if (!formData.to?.name?.trim())      { toast.error("Client name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, dueDate: formData.date, total: totalDue }),
      });
      if (res.ok) { toast.success("Receipt created"); router.push("/dashboard/receipts"); }
      else { const d = await res.json(); toast.error(d.message || "Failed to create"); }
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    const tid = toast.loading("Generating PDF…");
    try {
      const res = await fetch("/api/invoices/preview/receipt-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, total: totalDue }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${formData.invoiceNumber || "receipt"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded", { id: tid });
    } catch { toast.dismiss(tid); toast.error("Failed to generate PDF"); }
    finally { setDownloading(false); }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {showAddClient && <AddClientDialog onSave={handleNewClientSaved} onClose={() => setShowAddClient(false)} />}

      {/* ── Form ──────────────────────────────────────────────────────────────── */}
      <div className="w-full xl:w-1/2 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard/receipts")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Receipt</h1>
              <p className="text-sm text-gray-400">Fill in the details below</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard/receipts")}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gray-900 hover:bg-gray-800">
              {saving && <Spinner className="mr-2 h-3.5 w-3.5" />}
              {saving ? "Creating…" : "Create Receipt"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="billto">Bill To</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="received">Received By</TabsTrigger>
          </TabsList>

          {/* ── Details ──────────────────────────────────────────────────── */}
          <TabsContent value="details" className="space-y-4 pt-4">
            <Card>
              <CardHeader><CardTitle>Receipt Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Receipt Number *</Label>
                    <Input
                      placeholder="REC-001"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Receipt Date</Label>
                    <Input
                      type="date"
                      value={formData.date ? new Date(formData.date).toISOString().split("T")[0] : ""}
                      onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value), dueDate: new Date(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Document Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Hold">Hold</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  {formData.logoUrl && <img src={formData.logoUrl} alt="logo" className="h-12 mt-2 object-contain" />}
                  {uploadingLogo && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Spinner className="h-3 w-3" /> Uploading…</p>}
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h3 className="font-semibold text-sm">Your Company (From)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Company Name</Label><Input value={formData.from?.name} onChange={(e) => updateFrom("name", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Email</Label><Input value={formData.from?.email} onChange={(e) => updateFrom("email", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Phone</Label><Input value={formData.from?.phone} onChange={(e) => updateFrom("phone", e.target.value)} /></div>
                    <div className="col-span-2 space-y-2"><Label>Address</Label><Textarea value={formData.from?.address} onChange={(e) => updateFrom("address", e.target.value)} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Bill To ──────────────────────────────────────────────────── */}
          <TabsContent value="billto" className="space-y-4 pt-4">
            <Card>
              <CardHeader><CardTitle>Bill To (Client)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Load from preset</Label>
                  <ClientSearch clients={presetClients} onSelect={applyPresetClient} onAddNew={() => setShowAddClient(true)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Client Name *</Label><Input value={formData.to?.name} onChange={(e) => updateTo("name", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={formData.to?.email} onChange={(e) => updateTo("email", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={formData.to?.phone} onChange={(e) => updateTo("phone", e.target.value)} /></div>
                  <div className="col-span-2 space-y-2"><Label>Address</Label><Textarea value={formData.to?.address} onChange={(e) => updateTo("address", e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Items ────────────────────────────────────────────────────── */}
          <TabsContent value="items" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Line Items</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Currency</Label>
                      <select
                        value={ri.currency}
                        onChange={(e) => updateRI({ currency: e.target.value })}
                        className="border border-input rounded-md px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="BDT">BDT</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="INR">INR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={ri.showInvoiceNo}
                        onChange={(e) => updateRI({ showInvoiceNo: e.target.checked })}
                        className="rounded border-gray-300 accent-indigo-600"
                      />
                      Show Invoice No
                    </label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {ri.lineItems.map((item, i) => (
                  <div key={i} className="flex gap-3 items-end border-b pb-3">
                    {ri.showInvoiceNo && (
                      <div className="w-28 space-y-1.5">
                        <Label className="text-xs">Invoice No</Label>
                        <Input
                          placeholder="INV-001"
                          value={item.invoiceNo}
                          onChange={(e) => updateLineItem(i, "invoiceNo", e.target.value)}
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs">Account Name / Description *</Label>
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(i, "description", e.target.value)}
                      />
                    </div>
                    <div className="w-32 space-y-1.5">
                      <Label className="text-xs">Amount ({ri.currency})</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => updateLineItem(i, "amount", Number(e.target.value))}
                      />
                    </div>
                    <Button variant="destructive" size="icon" onClick={() => removeLineItem(i)} disabled={ri.lineItems.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button variant="outline" size="sm" onClick={addLineItem} className="mt-1">
                  <Plus className="h-4 w-4 mr-2" /> Add Row
                </Button>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex justify-between text-sm font-semibold text-gray-700">
                    <span>Total Due Amount</span>
                    <span>{totalDue.toLocaleString()} {ri.currency}</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Advance Amount ({ri.currency})</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={ri.paidAmount || ""}
                      placeholder="0"
                      onChange={(e) => updateRI({ paidAmount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Paid Amount ({ri.currency})</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={ri.receivedAmount || ""}
                      placeholder="0"
                      onChange={(e) => updateRI({ receivedAmount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t">
                    <span>Current Due</span>
                    <span>{(totalDue - (ri.paidAmount || 0) - (ri.receivedAmount || 0)).toLocaleString()} {ri.currency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Payment ──────────────────────────────────────────────────── */}
          <TabsContent value="payment" className="space-y-4 pt-4">
            <Card>
              <CardHeader><CardTitle>Payment Received In</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {(["cash", "cheque", "accountTransfer"] as const).map((method) => (
                    <label key={method} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={ri.paymentMethod === method}
                        onChange={() => updateRI({ paymentMethod: method })}
                        className="accent-indigo-600"
                      />
                      <span className="font-medium capitalize text-sm">
                        {method === "accountTransfer" ? "Account Transfer" : method.charAt(0).toUpperCase() + method.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>

                {ri.paymentMethod === "accountTransfer" && (
                  <div className="space-y-2 pt-2">
                    <Label>Account Transfer Name / Reference</Label>
                    <Input
                      placeholder="e.g. Bank name or reference"
                      value={ri.accountTransferName}
                      onChange={(e) => updateRI({ accountTransferName: e.target.value })}
                    />
                  </div>
                )}

                {ri.paymentMethod && (
                  <div className="pt-2">
                    <button
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                      onClick={() => updateRI({ paymentMethod: "", accountTransferName: "" })}
                    >
                      Clear selection
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Received By ──────────────────────────────────────────────── */}
          <TabsContent value="received" className="space-y-4 pt-4">
            <Card>
              <CardHeader><CardTitle>Received By</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name</Label><Input value={ri.receivedBy.name} onChange={(e) => updateReceivedBy("name", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Designation</Label><Input value={ri.receivedBy.designation} onChange={(e) => updateReceivedBy("designation", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Company Name</Label><Input value={ri.receivedBy.companyName} onChange={(e) => updateReceivedBy("companyName", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Mobile</Label><Input value={ri.receivedBy.mobile} onChange={(e) => updateReceivedBy("mobile", e.target.value)} /></div>
                  <div className="col-span-2 space-y-2"><Label>Address</Label><Textarea value={ri.receivedBy.address} onChange={(e) => updateReceivedBy("address", e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Live Preview ──────────────────────────────────────────────────────── */}
      <div className="w-full xl:w-1/2 flex flex-col items-center border-l pl-0 xl:pl-6">
        <div className="w-full flex justify-between items-center mb-4 py-2">
          <h2 className="text-xl font-bold">Preview</h2>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? <Spinner className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            {downloading ? "Generating…" : "Download PDF"}
          </Button>
        </div>
        <div className="w-full overflow-x-auto bg-muted/30 p-4 rounded-xl border flex justify-center">
          <div className="origin-top scale-[0.55] sm:scale-[0.7] xl:scale-[0.85] transition-transform">
            <ReceiptPreview data={{ ...formData, total: totalDue }} />
          </div>
        </div>
      </div>
    </div>
  );
}
