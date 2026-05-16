"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  MessageSquare,
  UserCircle,
  ContactRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "Invoice Services", href: "/dashboard/invoices2", icon: FileText },
  { name: "Quotations", href: "/dashboard/quotations", icon: FileText },
  { name: "Clients", href: "/dashboard/clients", icon: ContactRound },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
  { name: "Feedback", href: "/dashboard/feedback", icon: MessageSquare },
];

const NavLinks = ({ navigation, pathname, setSidebarOpen }: { navigation: any[], pathname: string, setSidebarOpen: (v: boolean) => void }) => (
  <nav className="flex-1 px-4 py-4 space-y-1">
    {navigation.map((item) => {
      const isActive = pathname === item.href || (item.name !== "Dashboard" && pathname.startsWith(item.href + "/"));
      return (
        <Link
          key={item.name}
          href={item.href}
          onClick={() => setSidebarOpen(false)}
          className={cn(
            isActive
              ? "bg-white/10 text-white rounded-xl"
              : "text-slate-400 hover:text-white transition-colors",
            "flex items-center space-x-3 px-4 py-3"
          )}
        >
          <item.icon
            className={cn(
              isActive ? "text-white" : "text-slate-400 hover:text-white",
              "w-5 h-5 flex-shrink-0"
            )}
            aria-hidden="true"
          />
          <span className="font-medium">{item.name}</span>
        </Link>
      );
    })}
  </nav>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-[#F3F4F6] font-sans overflow-hidden select-none md:flex-row">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-none">
          <div className="p-6 flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Jamroll</span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <NavLinks navigation={navigation} pathname={pathname} setSidebarOpen={setSidebarOpen} />
            
            <div className="p-4 border-t border-slate-800">
              <div 
                className="flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-red-400 cursor-pointer transition-colors"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Logout</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden w-64 shrink-0 bg-slate-900 flex-col md:flex">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Jamroll</span>
        </div>
        <div className="flex h-[calc(100vh-5rem)] flex-col justify-between overflow-y-auto">
          <NavLinks navigation={navigation} pathname={pathname} setSidebarOpen={setSidebarOpen} />
          
          <div className="p-4 border-t border-slate-800">
            <div 
              className="flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-red-400 cursor-pointer transition-colors"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Logout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden h-full">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2 text-slate-400"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <h2 className="text-xl font-semibold text-slate-800 hidden md:block">Dashboard Overview</h2>
            {session?.user?.role && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-100 hidden md:inline-flex">
                {session.user.role}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="relative cursor-pointer hidden sm:block">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex items-center space-x-3 pl-0 sm:pl-6 sm:border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{session?.user?.name || "User"}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Active Now</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                {session?.user?.image ? (
                  <img src={session.user.image} alt={session.user.name || "Avatar"} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {(session?.user?.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-8 md:p-8">
          {children}
        </main>
      </div>

      <Link href="/dashboard/invoices/create" className="absolute bottom-8 right-8 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-300 hidden md:flex items-center justify-center hover:scale-105 active:scale-95 transition-transform group z-50" aria-label="Go to all invoices">
        <svg className="w-6 h-6 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
      </Link>
    </div>
  );
}
