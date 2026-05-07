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
import { Trash2, Plus, Download, ArrowLeft } from "lucide-react";
import { InvoicePreview } from "@/components/InvoicePreview";
import { InvoiceFormData } from "@/types/invoice";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function EditInvoicePage() {
  const { id } = useParams();
  const router  = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState<Partial<InvoiceFormData>>({
    type: "invoice",
    status: "Unpaid",
    invoiceNumber: "",
    name: "Invoice",
    date: new Date(),
    dueDate: new Date(),
    from: { name: "", email: "", phone: "", address: "" },
    to:   { name: "", email: "", phone: "", address: "" },
    paymentInfo: { accountName: "", accountNumber: "", bankName: "", branch: "", swift: "", currency: "USD" },
    items: [{ name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }],
    vat: 0, discount: 0, total: 0,
  });

  // Load existing invoice
  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setFormData({ ...data, date: new Date(data.date), dueDate: new Date(data.dueDate) });
        setPageLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load invoice");
        router.push("/dashboard/invoices");
      });
  }, [id]);

  // Live total — computed, never stored in state
  const subtotal = useMemo(
    () => (formData.items || []).reduce((s, i) => s + i.quantity * i.unitPrice, 0),
    [formData.items],
  );
  const liveTotal = useMemo(
    () => (subtotal - (formData.discount || 0)) * (1 + (formData.vat || 0) / 100),
    [subtotal, formData.discount, formData.vat],
  );

  // ── Field helpers ───────────────────────────────────────────────────────────
  const updateFrom    = (f: string, v: string) => setFormData((p) => ({ ...p, from: { ...p.from!, [f]: v } }));
  const updateTo      = (f: string, v: string) => setFormData((p) => ({ ...p, to:   { ...p.to!,   [f]: v } }));
  const updatePayment = (f: string, v: string) => setFormData((p) => ({ ...p, paymentInfo: { ...p.paymentInfo!, [f]: v } }));

  const addItem = () => setFormData((p) => ({ ...p, items: [...(p.items || []), { name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }] }));
  const removeItem = (i: number) => setFormData((p) => { const items = [...(p.items || [])]; items.splice(i, 1); return { ...p, items }; });
  const updateItem = (i: number, f: string, v: string | number) =>
    setFormData((p) => { const items = [...(p.items || [])]; items[i] = { ...items[i], [f]: v }; return { ...p, items }; });

  const addSubItem = (itemIndex: number) =>
    setFormData((p) => { const items = [...(p.items || [])]; items[itemIndex] = { ...items[itemIndex], subItems: [...(items[itemIndex].subItems || []), ""] }; return { ...p, items }; });
  const updateSubItem = (itemIndex: number, subIndex: number, value: string) =>
    setFormData((p) => { const items = [...(p.items || [])]; const subItems = [...(items[itemIndex].subItems || [])]; subItems[subIndex] = value; items[itemIndex] = { ...items[itemIndex], subItems }; return { ...p, items }; });
  const removeSubItem = (itemIndex: number, subIndex: number) =>
    setFormData((p) => { const items = [...(p.items || [])]; const subItems = [...(items[itemIndex].subItems || [])]; subItems.splice(subIndex, 1); items[itemIndex] = { ...items[itemIndex], subItems }; return { ...p, items }; });

  // ── Logo upload ─────────────────────────────────────────────────────────────
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

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, total: liveTotal }),
      });
      if (res.ok) {
        toast.success("Invoice saved");
        router.push("/dashboard/invoices");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to save");
      }
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  };

  // ── Download PDF ────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const tid    = toast.loading("Generating PDF…");
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdfWidthPt = 595.28;
      const pdfHeightPt = (canvas.height / canvas.width) * pdfWidthPt;
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [pdfWidthPt, pdfHeightPt] });
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidthPt, pdfHeightPt);
      pdf.save(`${formData.invoiceNumber || "invoice"}.pdf`);
      toast.success("PDF Downloaded", { id: tid });
    } catch { toast.error("Failed to generate PDF"); }
  };

  if (pageLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">Loading invoice…</div>;
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6">

      {/* ── Form ────────────────────────────────────────────────────────────── */}
      <div className="w-full xl:w-1/2 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard/invoices")}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
              <p className="text-sm text-gray-400">{formData.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard/invoices")} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gray-900 hover:bg-gray-800">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="client">Client</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          {/* ── Details ─────────────────────────────────────────────────────── */}
          <TabsContent value="details" className="space-y-4 pt-4">
            <Card>
              <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice Number</Label>
                    <Input value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Due</option>
                      <option value="Hold">Hold</option>
                      <option value="Cancelled">Cancel</option>
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
                    <Label>Due Date</Label>
                    <Input type="date"
                      value={formData.dueDate ? new Date(formData.dueDate).toISOString().split("T")[0] : ""}
                      onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value) })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  {formData.logoUrl && <img src={formData.logoUrl} alt="logo" className="h-12 mt-2 object-contain" />}
                  {uploadingLogo && <p className="text-xs text-muted-foreground">Uploading…</p>}
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

          {/* ── Client ──────────────────────────────────────────────────────── */}
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

          {/* ── Items ───────────────────────────────────────────────────────── */}
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
                      <Input
                        placeholder="Add a note for this item..."
                        value={item.note || ""}
                        onChange={(e) => updateItem(i, "note", e.target.value)}
                      />
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
                          <Input
                            className="flex-1 h-7 text-sm"
                            placeholder="Sub-item description..."
                            value={sub}
                            onChange={(e) => updateSubItem(i, si, e.target.value)}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSubItem(i, si)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
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

          {/* ── Payment ─────────────────────────────────────────────────────── */}
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

      {/* ── Live Preview ─────────────────────────────────────────────────────── */}
      <div className="w-full xl:w-1/2 flex flex-col items-center border-l pl-0 xl:pl-6">
        <div className="w-full flex justify-between items-center mb-4 sticky top-0 bg-background z-10 py-2">
          <h2 className="text-xl font-bold">Preview</h2>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
        <div className="w-full overflow-x-auto bg-muted/30 p-4 rounded-xl border flex justify-center">
          <div className="origin-top scale-[0.6] sm:scale-75 xl:scale-90 transition-transform">
            <InvoicePreview data={{ ...formData, total: liveTotal }} ref={printRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
