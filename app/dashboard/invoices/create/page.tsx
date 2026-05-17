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
import { Trash2, Plus, Download, Search, X, UserPlus } from "lucide-react";
import { InvoicePreview, PAGE_WIDTH, PAGE_HEIGHT } from "@/components/InvoicePreview";
import { InvoiceFormData } from "@/types/invoice";
import { ClientData } from "@/types/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Spinner } from "@/components/ui/spinner";

// ── Quick-Add Client Dialog ───────────────────────────────────────────────────
function AddClientDialog({
  onSave,
  onClose,
}: {
  onSave: (client: ClientData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: "", companyName: "", email: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Client saved");
        onSave(json);
      } else {
        toast.error(json.message || "Failed to save");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
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
            <div className="space-y-1.5 col-span-2">
              <Label>Address</Label>
              <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St, City" rows={2} />
            </div>
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
function ClientSearch({
  clients,
  onSelect,
  onAddNew,
}: {
  clients: ClientData[];
  onSelect: (c: ClientData) => void;
  onAddNew: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.companyName.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase())
      )
    : clients;

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search preset clients…"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        />
      </div>
      {open && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filtered.length === 0 && query.trim() && (
            <p className="px-4 py-3 text-sm text-gray-400">No clients found.</p>
          )}
          {filtered.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => { onSelect(c); setQuery(""); setOpen(false); }}
              className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <p className="text-sm font-semibold text-gray-900">{c.name}</p>
              {(c.companyName || c.email) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {[c.companyName, c.email].filter(Boolean).join(" · ")}
                </p>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setOpen(false); onAddNew(); }}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium border-t border-gray-100"
          >
            <UserPlus className="h-4 w-4" /> Add new client
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CreateInvoicePage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [savingAs, setSavingAs] = useState<string | null>(null);
  const [presetClients, setPresetClients] = useState<ClientData[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);

  const [formData, setFormData] = useState<Partial<InvoiceFormData>>({
    type: "invoice",
    status: "Unpaid",
    invoiceNumber: "",
    name: "Invoice",
    date: new Date(),
    dueDate: new Date(),
    from: { name: "", email: "", phone: "", address: "" },
    to: { name: "sadsdasd", email: "", phone: "", address: "" },
    paymentInfo: { accountName: "", accountNumber: "", bankName: "", branch: "", swift: "", currency: "USD" },
    items: [{ name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }],
    vat: 0,
    discount: 0,
    total: 0,
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      invoiceNumber: "INV-" + Math.floor(Math.random() * 10000).toString().padStart(4, "0"),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    }));
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPresetClients(data); })
      .catch(() => {});
  }, []);

  const applyPresetClient = (client: ClientData) => {
    setFormData((prev) => ({
      ...prev,
      to: {
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
      },
    }));
    toast.success(`Loaded "${client.name}"`);
  };

  const handleNewClientSaved = (client: ClientData) => {
    setPresetClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
    applyPresetClient(client);
    setShowAddClient(false);
  };

  const updateFrom = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, from: { ...prev.from!, [field]: value } }));
  };

  const updateTo = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, to: { ...prev.to!, [field]: value } }));
  };

  const updatePayment = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, paymentInfo: { ...prev.paymentInfo!, [field]: value } }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), { name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }],
    }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData((prev) => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const removeItem = (index: number) => {
    setFormData((prev) => {
      const newItems = [...(prev.items || [])];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };

  const addSubItem = (itemIndex: number) => {
    setFormData((prev) => {
      const newItems = [...(prev.items || [])];
      newItems[itemIndex] = { ...newItems[itemIndex], subItems: [...(newItems[itemIndex].subItems || []), ""] };
      return { ...prev, items: newItems };
    });
  };

  const updateSubItem = (itemIndex: number, subIndex: number, value: string) => {
    setFormData((prev) => {
      const newItems = [...(prev.items || [])];
      const subItems = [...(newItems[itemIndex].subItems || [])];
      subItems[subIndex] = value;
      newItems[itemIndex] = { ...newItems[itemIndex], subItems };
      return { ...prev, items: newItems };
    });
  };

  const removeSubItem = (itemIndex: number, subIndex: number) => {
    setFormData((prev) => {
      const newItems = [...(prev.items || [])];
      const subItems = [...(newItems[itemIndex].subItems || [])];
      subItems.splice(subIndex, 1);
      newItems[itemIndex] = { ...newItems[itemIndex], subItems };
      return { ...prev, items: newItems };
    });
  };

  // Recalculate total
  const subtotal = (formData.items || []).reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const totalAmount = (subtotal - (formData.discount || 0)) * (1 + (formData.vat || 0) / 100);
  
  if (formData.total !== totalAmount) {
    setFormData((prev) => ({ ...prev, total: totalAmount }));
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        setFormData((prev) => ({ ...prev, logoUrl: data.url }));
        toast.success("Logo uploaded");
      } else {
        toast.error(data.message || "Failed to upload logo");
      }
    } catch (error) {
      toast.error("Upload error");
    } finally {
      setUploadingLogo(false);
    }
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
        router.push("/dashboard/invoices");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to save invoice");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
      setSavingAs(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setDownloading(true);
    const toastId = toast.loading("Generating PDF...");
    try {
      const pageEls = pdfRef.current.querySelectorAll<HTMLElement>("[data-invoice-page]");
      if (!pageEls.length) {
        toast.error("Invoice not ready", { id: toastId });
        return;
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [PAGE_WIDTH, PAGE_HEIGHT],
      });

      for (let i = 0; i < pageEls.length; i++) {
        const canvas = await html2canvas(pageEls[i], {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        if (i > 0) pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], "portrait");
        pdf.addImage(imgData, "PNG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
      }

      pdf.save(`${formData.invoiceNumber}.pdf`);
      toast.success("PDF Downloaded", { id: toastId });
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
    {showAddClient && (
      <AddClientDialog
        onSave={handleNewClientSaved}
        onClose={() => setShowAddClient(false)}
      />
    )}
    <div className="flex flex-col xl:flex-row gap-4">
      {/* Editor / Form */}
      <div className="w-full xl:w-1/2 space-y-6 items-center rounded-xl border p-6 xl:pl-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create Invoice</h1>
          <div className="flex gap-2">
            <Button className='bg-red-200 hover:bg-red-300 text-black' onClick={() => handleSave("Hold")} disabled={loading}>
              {savingAs === "Hold" && <Spinner className="mr-2 h-3.5 w-3.5" />}
              Save Hold
            </Button>
            <Button className='bg-yellow-200 text-black hover:bg-yellow-300' onClick={() => handleSave("Unpaid")} disabled={loading}>
              {savingAs === "Unpaid" && <Spinner className="mr-2 h-3.5 w-3.5" />}
              Save Unpaid
            </Button>
            <Button className='bg-green-200 text-black hover:bg-green-300' onClick={() => handleSave("Paid")} disabled={loading}>
              {savingAs === "Paid" && <Spinner className="mr-2 h-3.5 w-3.5" />}
              Save Paid
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
          
          <TabsContent value="details" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice Number</Label>
                    <Input 
                      value={formData.invoiceNumber} 
                      onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Document Name</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input 
                      type="date" 
                      value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ""} 
                      onChange={(e) => setFormData({...formData, date: new Date(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input 
                      type="date" 
                      value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ""} 
                      onChange={(e) => setFormData({...formData, dueDate: new Date(e.target.value)})} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  {uploadingLogo && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Spinner className="h-3 w-3" /> Uploading…
                    </p>
                  )}
                </div>

                {/* <div className="pt-4 border-t space-y-4">
                  <h3 className="font-semibold text-sm">Your Company (From)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input value={formData.from?.name} onChange={(e) => updateFrom("name", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={formData.from?.email} onChange={(e) => updateFrom("email", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={formData.from?.phone} onChange={(e) => updateFrom("phone", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea value={formData.from?.address} onChange={(e) => updateFrom("address", e.target.value)} />
                    </div>
                  </div>
                </div> */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Details (To)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preset client search */}
                <div className="space-y-2">
                  <Label>Search Preset Clients</Label>
                  <ClientSearch
                    clients={presetClients}
                    onSelect={applyPresetClient}
                    onAddNew={() => setShowAddClient(true)}
                  />
                  {presetClients.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No preset clients yet.{" "}
                      <button
                        type="button"
                        onClick={() => setShowAddClient(true)}
                        className="text-indigo-600 hover:underline"
                      >
                        Add one now
                      </button>
                    </p>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <p className="text-xs text-muted-foreground">Or fill in manually:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Client Name</Label>
                      <Input value={formData.to?.name} onChange={(e) => updateTo("name", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={formData.to?.email} onChange={(e) => updateTo("email", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={formData.to?.phone} onChange={(e) => updateTo("phone", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea value={formData.to?.address} onChange={(e) => updateTo("address", e.target.value)} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-4 pt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-2"/> Add Item</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.items?.map((item, index) => (
                  <div key={index} className="border-b pb-4 space-y-3">
                    <div className="flex gap-4 items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Description</Label>
                        <Input value={item.name} onChange={(e) => updateItem(index, "name", e.target.value)} />
                      </div>
                      <div className="w-24 space-y-2">
                        <Label>Qty</Label>
                        <Input type="number" value={item.quantity} onChange={(e) => updateItem(index, "quantity", Number(e.target.value))} />
                      </div>
                      <div className="w-32 space-y-2">
                        <Label>Price</Label>
                        <Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))} />
                      </div>
                      <Button variant="destructive" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 pl-2">
                      <Label className="text-muted-foreground text-xs">Note (optional)</Label>
                      <Input
                        placeholder="Add a note for this item..."
                        value={item.note || ""}
                        onChange={(e) => updateItem(index, "note", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 pl-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-muted-foreground text-xs">Sub-items</Label>
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => addSubItem(index)}>
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
                            onChange={(e) => updateSubItem(index, si, e.target.value)}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSubItem(index, si)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Discount Amount</Label>
                    <Input type="number" step="0.01" value={formData.discount} onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>VAT (%)</Label>
                    <Input type="number" step="0.1" value={formData.vat} onChange={(e) => setFormData({...formData, vat: Number(e.target.value)})} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input value={formData.paymentInfo?.currency} onChange={(e) => updatePayment("currency", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input value={formData.paymentInfo?.bankName} onChange={(e) => updatePayment("bankName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input value={formData.paymentInfo?.accountName} onChange={(e) => updatePayment("accountName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input value={formData.paymentInfo?.accountNumber} onChange={(e) => updatePayment("accountNumber", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Input value={formData.paymentInfo?.branch} onChange={(e) => updatePayment("branch", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>SWIFT / BIC</Label>
                    <Input value={formData.paymentInfo?.swift} onChange={(e) => updatePayment("swift", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Live Preview */}
      <div className="w-full xl:w-1/2 flex flex-col items-center  pl-0 xl:pl-6">
        {/* <div className="w-full flex justify-between items-center mb-4 sticky top-0 bg-background z-10 py-2">
          <h2 className="text-xl font-bold">Live Preview</h2>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? <Spinner className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            {downloading ? "Generating…" : "Download PDF"}
          </Button>
        </div> */}
        
        <div className="w-full overflow-x-auto bg-muted/30 p-4 rounded-xl border flex justify-center">
          <div className="origin-top scale-[0.6] sm:scale-75 xl:scale-90 transition-transform">
            <InvoicePreview data={formData} ref={printRef} />
          </div>
        </div>
      </div>
    </div>

    {/* Hidden full-size invoice used only for PDF capture — no parent CSS transform */}
    <div
      aria-hidden="true"
      style={{ position: "fixed", left: "-9999px", top: 0, opacity: 0, pointerEvents: "none" }}
    >
      <InvoicePreview data={formData} ref={pdfRef} />
    </div>
    </>
  );
}
