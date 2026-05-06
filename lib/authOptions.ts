import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import { User } from "@/models/User";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isCorrectPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isCorrectPassword) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await dbConnect();
        try {
          const userExists = await User.findOne({ email: user.email });

          if (!userExists) {
            // First user is super admin by default? Next.js wait, maybe I shouldn't automatically make them super admin, 
            // but for previewing it's helpful. Let's make the FIRST user ever the Super Admin.
            const userCount = await User.countDocuments();
            const isFirstUser = userCount === 0;

            const newUser = await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              role: isFirstUser ? "Super Admin" : "Employee",
              status: isFirstUser ? "approved" : "pending",
            });
            
            user.id = newUser._id.toString();
            (user as any).role = newUser.role;
            (user as any).status = newUser.status;
          } else {
            user.id = userExists._id.toString();
            (user as any).role = userExists.role;
            (user as any).status = userExists.status;
          }
          return true;
        } catch (error) {
          console.error("Error checking/creating user from Google SignIn:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.status = (user as any).status;
      }
      if (trigger === "update" && session) {
        token.role = session.role;
        token.status = session.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
