"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  Menu,
  MessageSquare,
  UserCircle,
  ContactRound,
  ReceiptText,
  Trash2,
  Plus,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "Service Invoices", href: "/dashboard/service-invoices", icon: FileText },
  { name: "Quotations", href: "/dashboard/quotations", icon: FileText },
  { name: "Receipts", href: "/dashboard/receipts", icon: ReceiptText },
  { name: "Clients", href: "/dashboard/clients", icon: ContactRound },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
  { name: "Feedback", href: "/dashboard/feedback", icon: MessageSquare },
  { name: "Trash", href: "/dashboard/trash", icon: Trash2 },
];

const NavLinks = ({
  navigation,
  pathname,
  setSidebarOpen,
}: {
  navigation: any[];
  pathname: string;
  setSidebarOpen: (v: boolean) => void;
}) => (
  <nav className="flex-1 px-3 py-4 space-y-0.5">
    {navigation.map((item) => {
      const isActive =
        pathname === item.href ||
        (item.name !== "Dashboard" && pathname.startsWith(item.href + "/"));
      return (
        <Link
          key={item.name}
          href={item.href}
          onClick={() => setSidebarOpen(false)}
          className={cn(
            "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm md:text-base transition-colors",
            isActive
              ? "bg-[#5A378F]/40 text-white"
              : "text-white/60 hover:bg-white/5 hover:text-white/70"
          )}
        >
          <item.icon
            className={cn("w-4 h-4 shrink-0", isActive ? "text-[#51B9A9]" : "text-[#7F77DD]")}
            aria-hidden="true"
          />
          <span className="font-medium">{item.name}</span>
        </Link>
      );
    })}
  </nav>
);

const SidebarContent = ({
  pathname,
  setSidebarOpen,
}: {
  pathname: string;
  setSidebarOpen: (v: boolean) => void;
}) => (
  <div className="flex h-full flex-col bg-[#1a1a2e]">
    {/* Logo */}
    <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
      <div className="w-8 h-8 bg-[#5A378F] rounded-lg flex items-center justify-center shrink-0">
        <Plus className="w-4 h-4 text-white rotate-45" aria-hidden="true" />
      </div>
      <span className="text-white font-semibold text-lg tracking-tight">Jamroll</span>
    </div>

    {/* Nav */}
    <div className="flex flex-1 flex-col overflow-y-auto justify-between">
      <NavLinks
        navigation={navigation}
        pathname={pathname}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm md:text-base text-[#7F77DD] hover:bg-white/5 hover:text-[#EA2B7B] transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  </div>
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = (session?.user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen flex-col bg-[#F0F0F0] font-sans overflow-hidden select-none md:flex-row">
      {/* Mobile sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-60 p-0 border-none">
          <SidebarContent pathname={pathname} setSidebarOpen={setSidebarOpen} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden w-60 shrink-0 md:block">
        <SidebarContent pathname={pathname} setSidebarOpen={setSidebarOpen} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden h-full">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E0E0E0] bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-400"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <h2 className="text-xl font-semibold text-[#1A1A1A] hidden md:block">
              Dashboard Overview
            </h2>
            {session?.user?.role && (
              <span className="px-2.5 py-0.5 bg-[#EEEDFE] text-[#3C3489] text-xs font-semibold uppercase tracking-wider rounded-full border border-[#AFA9EC]/40 hidden md:inline-flex">
                {session.user.role}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Bell */}
            <div className="relative hidden sm:block">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#EA2B7B] rounded-full border border-white" />
            </div>

            {/* User */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-base font-semibold text-[#1A1A1A]">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-[#51B9A9] font-semibold uppercase tracking-wide">
                  Active now
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#5A378F] flex items-center justify-center overflow-hidden shrink-0">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xs font-semibold">{initials}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>

      {/* FAB */}
      <Link
        href="/dashboard/invoices/create"
        className="absolute bottom-7 right-7 w-12 h-12 bg-[#5A378F] hover:bg-[#4a2d7a] text-white rounded-full hidden md:flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-50"
        aria-label="Create new invoice"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
      </Link>
    </div>
  );
}