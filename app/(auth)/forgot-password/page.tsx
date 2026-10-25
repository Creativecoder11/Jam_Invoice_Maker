"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, KeyRound, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setSubmitted(true);
            toast.success("If an account exists, a reset link has been requested.");
        } catch {
            toast.error("An error occurred. Please try again.");
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
                        <KeyRound className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-widest text-[#7F77DD] mb-2">
                            Reset password
                        </p>
                        <h2 className="text-2xl font-medium text-[#EEEDFE] leading-snug mb-3">
                            Forgot your password? We&apos;ll help you get back in.
                        </h2>
                        <p className="text-sm text-[#7F77DD] leading-relaxed">
                            Enter your account email and we&apos;ll send a reset link, or
                            ask your Super Admin to reset it for you.
                        </p>
                    </div>
                    <div />
                </div>

                {/* Right form */}
                <div className="flex-1 bg-background px-8 py-10 flex flex-col justify-center">
                    {!submitted ? (
                        <>
                            <h1 className="text-xl font-medium text-[#1A1A1A] mb-1">
                                Forgot password
                            </h1>
                            <p className="text-sm text-[#1A1A1A]/40 mb-7">
                                Enter the email associated with your account
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="email"
                                        className="flex items-center gap-1.5 text-xs font-medium text-[#1A1A1A]/50"
                                    >
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

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#5A378F] hover:bg-[#4a2d7a] text-white gap-2"
                                >
                                    {loading ? "Sending..." : "Send reset link"}
                                    {!loading && <ArrowRight className="h-4 w-4" />}
                                </Button>
                            </form>

                            <p className="text-center text-sm text-[#1A1A1A]/40 mt-5">
                                Remembered your password?{" "}
                                <Link href="/login" className="text-[#51B9A9] hover:underline">
                                    Back to sign in
                                </Link>
                            </p>
                        </>
                    ) : (
                        <Card className="border-none shadow-none">
                            <CardHeader>
                                <CardTitle>Check your inbox</CardTitle>
                                <CardDescription>
                                    If an account exists for{" "}
                                    <span className="font-semibold">{email}</span>, a reset link
                                    has been requested.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-[#1A1A1A]/60">
                                    If you don&apos;t receive an email within 10 minutes, please
                                    contact your Super Admin to have your password reset
                                    manually from the Users admin panel.
                                </p>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/login">Back to sign in</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
