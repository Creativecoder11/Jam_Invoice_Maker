"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, Lock, Mail, Phone, User, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Registration successful! You can now log in.");
        router.push("/login");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch {
      toast.error("An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="flex w-full max-w-3xl overflow-hidden rounded-xl border border-border">
        {/* Left panel */}
        <div className="hidden md:flex md:flex-col md:justify-between w-80 shrink-0 bg-[#1a1a2e] p-8">
          <div className="w-9 h-9 rounded-lg bg-[#5A378F] flex items-center justify-center">
            <UserPlus className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#7F77DD] mb-2">
              Get started
            </p>
            <h2 className="text-2xl font-medium text-[#EEEDFE] leading-snug mb-3">
              Start managing invoices and quotations with ease
            </h2>
            <p className="text-sm text-[#7F77DD] leading-relaxed">
              Generate professional invoices, send quotations, and streamline your billing workflow.
            </p>
          </div>
          <div />
        </div>

        {/* Right form */}
        <div className="flex-1 bg-background px-8 py-10 flex flex-col justify-center">
          <h1 className="text-xl font-medium text-[#1A1A1A] mb-1">Register</h1>
          <p className="text-sm text-[#1A1A1A]/40 mb-6">
            Fill in your details to get started
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="flex items-center gap-1.5 text-xs font-medium text-[#1A1A1A]/50">
                  <User className="h-3.5 w-3.5" /> Full name
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs font-medium text-[#1A1A1A]/50">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-1.5 text-xs font-medium text-[#1A1A1A]/50">
                <Mail className="h-3.5 w-3.5" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="flex items-center gap-1.5 text-xs font-medium text-[#1A1A1A]/50">
                <Lock className="h-3.5 w-3.5" /> Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A378F] hover:bg-[#4a2d7a] text-white gap-2"
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="text-center text-sm text-[#1A1A1A]/40 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-[#51B9A9] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}