import type {Metadata} from 'next';
// @ts-ignore: CSS module declarations may not be available in this environment
import './globals.css';
import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import { Providers } from './Providers';
import { Toaster } from '@/components/ui/sonner';

const helveticaNow = localFont({
  src: [
    { path: '../public/fonts/HelveticaNowDisplay-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/HelveticaNowDisplay-Medium.ttf',  weight: '500', style: 'normal' },
    { path: '../public/fonts/HelveticaNowDisplay-Bold.ttf',    weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Jamroll Invoicemaker',
  description: 'A modern SaaS invoice web application with RBAC, PDF generation, and MongoDB.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", helveticaNow.variable)}>
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
