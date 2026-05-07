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
import { Trash2, Plus, Download } from "lucide-react";
import { InvoicePreview } from "@/components/InvoicePreview";
import { InvoiceFormData } from "@/types/invoice";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function CreateQuotationPage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState<Partial<InvoiceFormData>>({
    type: "quotation",
    status: "Hold",
    invoiceNumber: "",
    name: "Quotation",
    date: new Date(),
    dueDate: new Date(),
    from: { name: "", email: "", phone: "", address: "" },
    to: { name: "", email: "", phone: "", address: "" },
    paymentInfo: { accountName: "", accountNumber: "", bankName: "", branch: "", swift: "", currency: "USD" },
    items: [{ name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }],
    vat: 0,
    discount: 0,
    total: 0,
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      invoiceNumber: "QTN-" + Math.floor(Math.random() * 10000).toString().padStart(4, "0"),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    }));
  }, []);

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
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status }),
      });
      if (res.ok) {
        toast.success(`Quotation saved`);
        router.push("/dashboard/quotations");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to save quotation");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    try {
      const toastId = toast.loading("Generating PDF...");
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdfWidthPt = 595.28;
      const pdfHeightPt = (canvas.height / canvas.width) * pdfWidthPt;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [pdfWidthPt, pdfHeightPt],
      });

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidthPt, pdfHeightPt);
      pdf.save(`${formData.invoiceNumber}.pdf`);
      toast.success("PDF Downloaded", { id: toastId });
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="w-full xl:w-1/2 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create Quotation</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave("Hold")} disabled={loading}>Save Draft</Button>
            <Button variant="default" onClick={() => handleSave("Unpaid")} disabled={loading}>Save Pending</Button>
            <Button variant="secondary" onClick={() => handleSave("Paid")} disabled={loading}>Save Accepted</Button>
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
                <CardTitle>Quotation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quotation Number</Label>
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
                    <Label>Valid Until</Label>
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
                  {uploadingLogo && <p className="text-xs text-muted-foreground">Uploading...</p>}
                </div>

                <div className="pt-4 border-t space-y-4">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client" className="space-y-4 pt-4">
             <Card>
              <CardHeader>
                <CardTitle>Client Details (To)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

      <div className="w-full xl:w-1/2 flex flex-col items-center border-l pl-0 xl:pl-6">
        <div className="w-full flex justify-between items-center mb-4 sticky top-0 bg-background z-10 py-2">
          <h2 className="text-xl font-bold">Live Preview</h2>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
        
        <div className="w-full overflow-x-auto bg-muted/30 p-4 rounded-xl border flex justify-center">
          <div className="origin-top scale-[0.6] sm:scale-75 xl:scale-90 transition-transform">
            <InvoicePreview data={formData} ref={printRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
