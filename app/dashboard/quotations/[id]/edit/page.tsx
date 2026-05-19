"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, Plus, Download, ArrowLeft, Search, X, UserPlus } from "lucide-react";
import { InvoicePreview, PAGE_WIDTH, PAGE_HEIGHT } from "@/components/InvoicePreview";
import { InvoiceFormData } from "@/types/invoice";
import { ClientData } from "@/types/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Spinner } from "@/components/ui/spinner";

// ── Quick-Add Client Dialog ───────────────────────────────────────────────────
function AddClientDialog({ onSave, onClose }: { onSave: (c: ClientData) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", companyName: "", email: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

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
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Add New Client</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.companyName.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()))
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
        <Input className="pl-9" placeholder="Search preset clients…" value={query} onFocus={() => setOpen(true)} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} />
      </div>
      {open && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filtered.length === 0 && query.trim() && <p className="px-4 py-3 text-sm text-gray-400">No clients found.</p>}
          {filtered.map((c) => (
            <button key={c._id} type="button" onClick={() => { onSelect(c); setQuery(""); setOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0">
              <p className="text-sm font-semibold text-gray-900">{c.name}</p>
              {(c.companyName || c.email) && <p className="text-xs text-gray-400 mt-0.5">{[c.companyName, c.email].filter(Boolean).join(" · ")}</p>}
            </button>
          ))}
          <button type="button" onClick={() => { setOpen(false); onAddNew(); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium border-t border-gray-100">
            <UserPlus className="h-4 w-4" /> Add new client
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EditQuotationPage() {
  const { id } = useParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [presetClients, setPresetClients] = useState<ClientData[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);

  const [formData, setFormData] = useState<Partial<InvoiceFormData>>({
    type: "quotation",
    status: "Unpaid",
    invoiceNumber: "",
    name: "Quotation",
    date: new Date(),
    dueDate: new Date(),
    from: { name: "", email: "", phone: "", address: "" },
    to:   { name: "", email: "", phone: "", address: "" },
    items: [{ name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }],
    notes: { text: "", points: [] },
    vat: 0, discount: 0, total: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ])
      .then(([inv, clients]) => {
        setFormData({
          ...inv,
          date: new Date(inv.date),
          dueDate: new Date(inv.dueDate),
          notes: inv.notes || { text: "", points: [] },
        });
        if (Array.isArray(clients)) setPresetClients(clients);
        setPageLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load quotation");
        router.push("/dashboard/quotations");
      });
  }, [id]);

  const subtotal = useMemo(
    () => (formData.items || []).reduce((s, i) => s + i.quantity * i.unitPrice, 0),
    [formData.items],
  );
  const liveTotal = useMemo(
    () => (subtotal - (formData.discount || 0)) * (1 + (formData.vat || 0) / 100),
    [subtotal, formData.discount, formData.vat],
  );

  const applyPresetClient = (client: ClientData) => {
    setFormData((prev) => ({ ...prev, to: { name: client.name, email: client.email, phone: client.phone, address: client.address } }));
    toast.success(`Loaded "${client.name}"`);
  };

  const handleNewClientSaved = (client: ClientData) => {
    setPresetClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
    applyPresetClient(client);
    setShowAddClient(false);
  };

  const updateTo      = (f: string, v: string) => setFormData((p) => ({ ...p, to: { ...p.to!, [f]: v } }));
  const addItem       = () => setFormData((p) => ({ ...p, items: [...(p.items || []), { name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }] }));
  const removeItem    = (i: number) => setFormData((p) => { const items = [...(p.items || [])]; items.splice(i, 1); return { ...p, items }; });
  const updateItem    = (i: number, f: string, v: string | number) => setFormData((p) => { const items = [...(p.items || [])]; items[i] = { ...items[i], [f]: v }; return { ...p, items }; });

  const addSubItem    = (ii: number) => setFormData((p) => { const items = [...(p.items || [])]; items[ii] = { ...items[ii], subItems: [...(items[ii].subItems || []), ""] }; return { ...p, items }; });
  const updateSubItem = (ii: number, si: number, v: string) => setFormData((p) => { const items = [...(p.items || [])]; const s = [...(items[ii].subItems || [])]; s[si] = v; items[ii] = { ...items[ii], subItems: s }; return { ...p, items }; });
  const removeSubItem = (ii: number, si: number) => setFormData((p) => { const items = [...(p.items || [])]; const s = [...(items[ii].subItems || [])]; s.splice(si, 1); items[ii] = { ...items[ii], subItems: s }; return { ...p, items }; });

  const addNotePoint    = () => setFormData((p) => ({ ...p, notes: { text: p.notes?.text || "", points: [...(p.notes?.points || []), ""] } }));
  const updateNotePoint = (i: number, v: string) => setFormData((p) => { const pts = [...(p.notes?.points || [])]; pts[i] = v; return { ...p, notes: { text: p.notes?.text || "", points: pts } }; });
  const removeNotePoint = (i: number) => setFormData((p) => { const pts = [...(p.notes?.points || [])]; pts.splice(i, 1); return { ...p, notes: { text: p.notes?.text || "", points: pts } }; });

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
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, total: liveTotal }),
      });
      if (res.ok) {
        toast.success("Quotation saved");
        router.push("/dashboard/quotations");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to save");
      }
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setDownloading(true);
    const tid = toast.loading("Generating PDF…");
    try {
      const pageEls = pdfRef.current.querySelectorAll<HTMLElement>("[data-invoice-page]");
      if (!pageEls.length) { toast.error("Not ready", { id: tid }); return; }
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [PAGE_WIDTH, PAGE_HEIGHT] });
      for (let i = 0; i < pageEls.length; i++) {
        const canvas = await html2canvas(pageEls[i], { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        if (i > 0) pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], "portrait");
        pdf.addImage(imgData, "PNG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
      }
      pdf.save(`${formData.invoiceNumber || "quotation"}.pdf`);
      toast.success("PDF Downloaded", { id: tid });
    } catch {
      toast.dismiss(tid);
      toast.error("Failed to generate PDF");
    } finally { setDownloading(false); }
  };

  if (pageLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">Loading quotation…</div>;
  }

  return (
    <>
      {showAddClient && <AddClientDialog onSave={handleNewClientSaved} onClose={() => setShowAddClient(false)} />}
      <div className="flex flex-col xl:flex-row gap-4">

        {/* ── Form ────────────────────────────────────────────────────────────── */}
        <div className="w-full xl:w-1/2 space-y-6 items-center rounded-xl border p-6">

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/dashboard/quotations")}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Quotation</h1>
                <p className="text-sm text-gray-400">{formData.invoiceNumber}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/dashboard/quotations")} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-gray-900 hover:bg-gray-800">
                {saving && <Spinner className="mr-2 h-3.5 w-3.5" />}
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* ── Details ─────────────────────────────────────────────────── */}
            <TabsContent value="details" className="space-y-4 pt-4">
              <Card>
                <CardHeader><CardTitle>Quotation Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quotation Number</Label>
                      <Input value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="Paid">Accepted</option>
                        <option value="Unpaid">Pending</option>
                        <option value="Hold">Draft</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Document Name</Label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date"
                        value={formData.date ? new Date(formData.date).toISOString().split("T")[0] : ""}
                        onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Valid Until</Label>
                      <Input type="date"
                        value={formData.dueDate ? new Date(formData.dueDate).toISOString().split("T")[0] : ""}
                        onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value) })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                    {formData.logoUrl && <img src={formData.logoUrl} alt="logo" className="h-12 mt-2 object-contain" />}
                    {uploadingLogo && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Spinner className="h-3 w-3" /> Uploading…
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Client ──────────────────────────────────────────────────── */}
            <TabsContent value="client" className="space-y-4 pt-4">
              <Card>
                <CardHeader><CardTitle>Client Details (To)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Search Preset Clients</Label>
                    <ClientSearch clients={presetClients} onSelect={applyPresetClient} onAddNew={() => setShowAddClient(true)} />
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-xs text-muted-foreground">Or edit manually:</p>
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

            {/* ── Items ───────────────────────────────────────────────────── */}
            <TabsContent value="items" className="space-y-4 pt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Line Items</CardTitle>
                  <Button size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(formData.items || []).map((item, i) => (
                    <div key={i} className="border-b pb-4 space-y-3">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2"><Label>Description</Label><Input value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)} /></div>
                        <div className="w-24 space-y-2"><Label>Qty</Label><Input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} /></div>
                        <div className="w-32 space-y-2"><Label>Price</Label><Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))} /></div>
                        <Button variant="destructive" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <div className="space-y-2 pl-2">
                        <Label className="text-muted-foreground text-xs">Note (optional)</Label>
                        <Input placeholder="Add a note for this item..." value={item.note || ""} onChange={(e) => updateItem(i, "note", e.target.value)} />
                      </div>
                      <div className="space-y-2 pl-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-muted-foreground text-xs">Sub-items</Label>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => addSubItem(i)}>
                            <Plus className="h-3 w-3 mr-1" /> Add sub-item
                          </Button>
                        </div>
                        {(item.subItems || []).map((sub, si) => (
                          <div key={si} className="flex gap-2 items-center">
                            <span className="text-muted-foreground text-sm">-</span>
                            <Input className="flex-1 h-7 text-sm" placeholder="Sub-item description..." value={sub} onChange={(e) => updateSubItem(i, si, e.target.value)} />
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSubItem(i, si)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2"><Label>Discount</Label><Input type="number" step="0.01" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })} /></div>
                    <div className="space-y-2"><Label>VAT (%)</Label><Input type="number" step="0.1" value={formData.vat} onChange={(e) => setFormData({ ...formData, vat: Number(e.target.value) })} /></div>
                  </div>
                  <div className="pt-4 border-t space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Discount</span><span>-${(formData.discount || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-400"><span>VAT ({formData.vat || 0}%)</span><span>+${(liveTotal - (subtotal - (formData.discount || 0))).toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span>${liveTotal.toFixed(2)}</span></div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Notes ───────────────────────────────────────────────────── */}
            <TabsContent value="notes" className="space-y-4 pt-4">
              <Card>
                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Notes Text</Label>
                    <Textarea
                      placeholder="Add general notes for this quotation..."
                      rows={4}
                      value={formData.notes?.text || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: { text: e.target.value, points: prev.notes?.points || [] },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Note Points</Label>
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={addNotePoint}>
                        <Plus className="h-3 w-3 mr-1" /> Add Point
                      </Button>
                    </div>
                    {(formData.notes?.points || []).length === 0 && (
                      <p className="text-xs text-muted-foreground">No points yet. Click &quot;Add Point&quot; to add bullet points.</p>
                    )}
                    {(formData.notes?.points || []).map((point, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="text-muted-foreground text-sm">•</span>
                        <Input className="flex-1" placeholder="Enter a note point..." value={point} onChange={(e) => updateNotePoint(i, e.target.value)} />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeNotePoint(i)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Live Preview ─────────────────────────────────────────────────────── */}
        <div className="w-full xl:w-1/2 flex flex-col items-center pl-0 xl:pl-6">
          <div className="w-full flex justify-between items-center mb-4 top-0 z-10 py-2">
            <h2 className="text-xl font-bold">Preview</h2>
            <Button variant="outline" onClick={handleDownloadPDF} disabled={downloading}>
              {downloading ? <Spinner className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              {downloading ? "Generating…" : "Download PDF"}
            </Button>
          </div>
          <div className="w-full overflow-x-auto bg-muted/30 p-4 rounded-xl border flex justify-center">
            <div className="origin-top scale-[0.6] sm:scale-75 xl:scale-90 transition-transform">
              <InvoicePreview data={{ ...formData, total: liveTotal }} ref={printRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden full-size for PDF capture */}
      <div aria-hidden="true" style={{ position: "fixed", left: "-9999px", top: 0, opacity: 0, pointerEvents: "none" }}>
        <InvoicePreview data={{ ...formData, total: liveTotal }} ref={pdfRef} />
      </div>
    </>
  );
}
