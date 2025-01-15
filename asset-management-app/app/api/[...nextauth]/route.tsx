// route.tsx
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Extend the User and Session types to include 'id'
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

// Define your NextAuth options
const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!process.env.DEFAULT_USERNAME || !process.env.DEFAULT_PASSWORD) {
          throw new Error("Environment variables DEFAULT_USERNAME and DEFAULT_PASSWORD must be set");
        }

        if (
          credentials?.username === process.env.DEFAULT_USERNAME &&
          credentials?.password === process.env.DEFAULT_PASSWORD
        ) {
          // Return user object including the id
          return { id: "1", name: "Admin User", email: "admin@example.com" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Add the 'id' property to the token
        token.id = user.id ?? null;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Ensure session includes the 'id' property
      session.user.id = token.id ?? ""; // Default to empty string if 'id' is not available
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

// Only export the handler as GET and POST for Next.js route
export { handler as GET, handler as POST };