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
import { Trash2, Plus, Download, ArrowLeft, ChevronDown, ChevronUp, X } from "lucide-react";
import { Invoice2Preview } from "@/components/Invoice2Preview";
import { Invoice2FormData, ServiceGroup, ServiceItem } from "@/types/invoice";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Spinner } from "@/components/ui/spinner";

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
    <div className="border border-purple-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between bg-purple-50 px-4 py-3 gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-bold text-purple-700 shrink-0">Service {serviceIdx + 1}</span>
          <Input
            value={service.serviceName}
            onChange={(e) => onUpdateName(e.target.value)}
            placeholder="e.g. Graphics Design Service"
            className="h-8 text-sm font-semibold border-purple-200 focus:ring-purple-300 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
            ${subtotal.toFixed(2)}
          </span>
          <button onClick={() => setCollapsed((c) => !c)} className="p-1 rounded hover:bg-purple-100 transition-colors">
            {collapsed ? <ChevronDown className="h-4 w-4 text-purple-500" /> : <ChevronUp className="h-4 w-4 text-purple-500" />}
          </button>
          <button onClick={onRemoveService} className="p-1 rounded hover:bg-red-100 transition-colors">
            <Trash2 className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4 bg-white">
          {service.items.map((item, ii) => (
            <div key={ii} className="border border-gray-100 rounded-lg p-3 space-y-3 bg-gray-50/50">
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-gray-500">Description</Label>
                  <Input value={item.name} onChange={(e) => onUpdateItem(ii, "name", e.target.value)}
                    placeholder="Item description" className="h-8 text-sm" />
                </div>
                <div className="w-20 space-y-1">
                  <Label className="text-xs text-gray-500">Qty</Label>
                  <Input type="number" min={0} value={item.quantity}
                    onChange={(e) => onUpdateItem(ii, "quantity", Number(e.target.value))} className="h-8 text-sm" />
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-xs text-gray-500">Unit Price</Label>
                  <Input type="number" min={0} step="0.01" value={item.unitPrice}
                    onChange={(e) => onUpdateItem(ii, "unitPrice", Number(e.target.value))} className="h-8 text-sm" />
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs text-gray-500">Amount</Label>
                  <div className="h-8 flex items-center text-sm font-semibold text-gray-700 px-2 bg-white border border-gray-200 rounded-md">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                  onClick={() => onRemoveItem(ii)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-1 pl-1">
                <Label className="text-xs text-gray-400">Note (optional)</Label>
                <Input placeholder="Add a note for this item..." value={item.note || ""}
                  onChange={(e) => onUpdateItem(ii, "note", e.target.value)} className="h-7 text-xs" />
              </div>

              <div className="space-y-1.5 pl-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-400">Sub-items</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-indigo-600 hover:text-indigo-700"
                    onClick={() => onAddSubItem(ii)}>
                    <Plus className="h-3 w-3 mr-1" /> Add sub-item
                  </Button>
                </div>
                {(item.subItems || []).map((sub, si) => (
                  <div key={si} className="flex gap-2 items-center">
                    <span className="text-gray-400 text-sm">—</span>
                    <Input className="flex-1 h-6 text-xs" placeholder="Sub-item description..."
                      value={sub} onChange={(e) => onUpdateSubItem(ii, si, e.target.value)} />
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-50"
                      onClick={() => onRemoveSubItem(ii, si)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <Button variant="outline" size="sm" onClick={onAddItem}
              className="h-7 text-xs border-dashed border-purple-300 text-purple-600 hover:bg-purple-50">
              <Plus className="h-3 w-3 mr-1" /> Add Item
            </Button>
            <div className="text-sm font-bold text-purple-700">
              Service Subtotal: <span className="text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const defaultService = (): ServiceGroup => ({
  serviceName: "",
  items: [{ name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }],
});

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EditInvoice2Page() {
  const { id } = useParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState<Partial<Invoice2FormData>>({
    type: "invoice2",
    status: "Unpaid",
    invoiceNumber: "",
    name: "Invoice",
    date: new Date(),
    dueDate: new Date(),
    from: { name: "", email: "", phone: "", address: "" },
    to: { name: "", email: "", phone: "", address: "" },
    paymentInfo: { accountName: "", accountNumber: "", bankName: "", branch: "", swift: "", currency: "USD" },
    services: [defaultService()],
    vat: 0,
    discount: 0,
    total: 0,
  });

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setFormData({
          ...data,
          date: new Date(data.date),
          dueDate: new Date(data.dueDate),
          services: Array.isArray(data.services) && data.services.length > 0 ? data.services : [defaultService()],
        });
        setPageLoading(false);
      })
      .catch(() => { toast.error("Failed to load invoice"); router.push("/dashboard/invoices2"); });
  }, [id]);

  // ── Computed totals ─────────────────────────────────────────────────────────
  const grandSubtotal = useMemo(
    () => (formData.services || []).reduce((s, svc) => s + svc.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0), 0),
    [formData.services],
  );
  const liveTotal = useMemo(
    () => (grandSubtotal - (formData.discount || 0)) * (1 + (formData.vat || 0) / 100),
    [grandSubtotal, formData.discount, formData.vat],
  );

  // ── Field helpers ───────────────────────────────────────────────────────────
  const updateTo      = (f: string, v: string) => setFormData((p) => ({ ...p, to: { ...p.to!, [f]: v } }));
  const updateFrom    = (f: string, v: string) => setFormData((p) => ({ ...p, from: { ...p.from!, [f]: v } }));
  const updatePayment = (f: string, v: string) => setFormData((p) => ({ ...p, paymentInfo: { ...p.paymentInfo!, [f]: v } }));

  const updateServices = (fn: (prev: ServiceGroup[]) => ServiceGroup[]) =>
    setFormData((p) => ({ ...p, services: fn([...(p.services || [])]) }));

  const addService    = () => updateServices((s) => [...s, defaultService()]);
  const removeService = (si: number) => updateServices((s) => s.filter((_, i) => i !== si));
  const updateServiceName = (si: number, v: string) =>
    updateServices((s) => { s[si] = { ...s[si], serviceName: v }; return s; });

  const addItem    = (si: number) =>
    updateServices((s) => { s[si] = { ...s[si], items: [...s[si].items, { name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }] }; return s; });
  const removeItem = (si: number, ii: number) =>
    updateServices((s) => { const items = [...s[si].items]; items.splice(ii, 1); s[si] = { ...s[si], items }; return s; });
  const updateItem = (si: number, ii: number, f: string, v: string | number) =>
    updateServices((s) => { const items = [...s[si].items]; items[ii] = { ...items[ii], [f]: v }; s[si] = { ...s[si], items }; return s; });

  const addSubItem    = (si: number, ii: number) =>
    updateServices((s) => { const items = [...s[si].items]; items[ii] = { ...items[ii], subItems: [...(items[ii].subItems || []), ""] }; s[si] = { ...s[si], items }; return s; });
  const updateSubItem = (si: number, ii: number, subI: number, v: string) =>
    updateServices((s) => { const items = [...s[si].items]; const subs = [...(items[ii].subItems || [])]; subs[subI] = v; items[ii] = { ...items[ii], subItems: subs }; s[si] = { ...s[si], items }; return s; });
  const removeSubItem = (si: number, ii: number, subI: number) =>
    updateServices((s) => { const items = [...s[si].items]; const subs = [...(items[ii].subItems || [])]; subs.splice(subI, 1); items[ii] = { ...items[ii], subItems: subs }; s[si] = { ...s[si], items }; return s; });

  // ── Logo upload ─────────────────────────────────────────────────────────────
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

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, total: liveTotal }),
      });
      if (res.ok) { toast.success("Invoice saved"); router.push("/dashboard/invoices2"); }
      else { const data = await res.json(); toast.error(data.message || "Failed to save"); }
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  };

  // ── Download PDF ────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    const tid = toast.loading("Generating PDF…");
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdfWidthPt = 595.28;
      const pdfHeightPt = (canvas.height / canvas.width) * pdfWidthPt;
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [pdfWidthPt, pdfHeightPt] });
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidthPt, pdfHeightPt);
      pdf.save(`${formData.invoiceNumber || "invoice"}.pdf`);
      toast.success("PDF Downloaded", { id: tid });
    } catch { toast.dismiss(tid); toast.error("Failed to generate PDF"); }
    finally { setDownloading(false); }
  };

  if (pageLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">Loading invoice…</div>;
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6">

      {/* ── Form ──────────────────────────────────────────────────────────────── */}
      <div className="w-full xl:w-1/2 space-y-6">

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard/invoices2")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Invoice 2</h1>
              <p className="text-sm text-gray-400">{formData.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard/invoices2")} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gray-900 hover:bg-gray-800">
              {saving && <Spinner className="mr-2 h-3.5 w-3.5" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="client">Client</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          {/* ── Details ───────────────────────────────────────────────────── */}
          <TabsContent value="details" className="space-y-4 pt-4">
            <Card>
              <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Invoice Number</Label>
                    <Input value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Status</Label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Due</option>
                      <option value="Hold">Hold</option>
                      <option value="Cancelled">Cancel</option>
                    </select>
                  </div>
                  <div className="space-y-2"><Label>Document Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Date</Label>
                    <Input type="date" value={formData.date ? new Date(formData.date).toISOString().split("T")[0] : ""}
                      onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })} /></div>
                  <div className="space-y-2 col-span-2"><Label>Due Date</Label>
                    <Input type="date" value={formData.dueDate ? new Date(formData.dueDate).toISOString().split("T")[0] : ""}
                      onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value) })} /></div>
                </div>
                <div className="space-y-2"><Label>Logo</Label>
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
                    <div className="space-y-2"><Label>Address</Label><Textarea value={formData.from?.address} onChange={(e) => updateFrom("address", e.target.value)} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Client ────────────────────────────────────────────────────── */}
          <TabsContent value="client" className="space-y-4 pt-4">
            <Card>
              <CardHeader><CardTitle>Client Details (To)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Client Name</Label><Input value={formData.to?.name} onChange={(e) => updateTo("name", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={formData.to?.email} onChange={(e) => updateTo("email", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={formData.to?.phone} onChange={(e) => updateTo("phone", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Address</Label><Textarea value={formData.to?.address} onChange={(e) => updateTo("address", e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Services ──────────────────────────────────────────────────── */}
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
                className="w-full border-dashed border-2 border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400 h-12">
                <Plus className="h-4 w-4 mr-2" /> Add Service
              </Button>

              <Card>
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Grand Subtotal</span><span>${grandSubtotal.toFixed(2)}</span></div>
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
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total</span><span>${liveTotal.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Payment ───────────────────────────────────────────────────── */}
          <TabsContent value="payment" className="space-y-4 pt-4">
            <Card>
              <CardHeader><CardTitle>Payment Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Currency</Label><Input value={formData.paymentInfo?.currency} onChange={(e) => updatePayment("currency", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Bank Name</Label><Input value={formData.paymentInfo?.bankName} onChange={(e) => updatePayment("bankName", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Account Name</Label><Input value={formData.paymentInfo?.accountName} onChange={(e) => updatePayment("accountName", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Account Number</Label><Input value={formData.paymentInfo?.accountNumber} onChange={(e) => updatePayment("accountNumber", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Branch</Label><Input value={formData.paymentInfo?.branch} onChange={(e) => updatePayment("branch", e.target.value)} /></div>
                  <div className="space-y-2"><Label>SWIFT / BIC</Label><Input value={formData.paymentInfo?.swift} onChange={(e) => updatePayment("swift", e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Live Preview ───────────────────────────────────────────────────────── */}
      <div className="w-full xl:w-1/2 flex flex-col items-center border-l pl-0 xl:pl-6">
        <div className="w-full flex justify-between items-center mb-4 top-0 z-10 py-2">
          <h2 className="text-xl font-bold">Preview</h2>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? <Spinner className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            {downloading ? "Generating…" : "Download PDF"}
          </Button>
        </div>
        <div className="w-full overflow-x-auto bg-muted/30 p-4 rounded-xl border flex justify-center">
          <div className="origin-top scale-[0.6] sm:scale-75 xl:scale-90 transition-transform">
            <Invoice2Preview data={{ ...formData, total: liveTotal }} ref={printRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
