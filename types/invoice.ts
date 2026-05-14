export type InvoiceItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  note?: string;
  subItems?: string[];
};

export type ServiceItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  note?: string;
  subItems?: string[];
};

export type ServiceGroup = {
  serviceName: string;
  items: ServiceItem[];
};

export type InvoiceFormData = {
  invoiceNumber: string;
  name: string;
  type: "invoice" | "invoice2" | "quotation";
  logoUrl?: string;
  
  from: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  
  to: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  
  date: Date;
  dueDate: Date;
  
  paymentInfo: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    swift: string;
    currency: string;
  };
  
  items: InvoiceItem[];
  
  vat: number;
  discount: number;
  total: number;
  
  status: "Paid" | "Unpaid" | "Hold" | "Cancelled";
};

export type Invoice2FormData = {
  invoiceNumber: string;
  name: string;
  type: "invoice2";
  logoUrl?: string;

  from: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  to: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  date: Date;
  dueDate: Date;

  paymentInfo: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    swift: string;
    currency: string;
  };

  services: ServiceGroup[];

  vat: number;
  discount: number;
  total: number;

  status: "Paid" | "Unpaid" | "Hold" | "Cancelled";
};
