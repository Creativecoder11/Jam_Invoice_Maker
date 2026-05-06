import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    if (token.status !== "approved") {
      return NextResponse.redirect(new URL("/pending-approval", req.url));
    }

    // Role-based protection: only Super Admin can access /dashboard/users and create invoices forms
    const isSuperAdmin = token.role === "Super Admin";

    if (pathname.startsWith("/dashboard/users") && !isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.includes("/create") && !isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // Protect edit routes
    if (pathname.includes("/edit") && !isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Protect pending-approval page
  if (pathname === "/pending-approval") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.status === "approved") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Prevent logged in users from seeing auth pages
  if (token && (pathname === "/login" || pathname === "/register")) {
    if (token.status !== "approved") {
      return NextResponse.redirect(new URL("/pending-approval", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/pending-approval"],
};
