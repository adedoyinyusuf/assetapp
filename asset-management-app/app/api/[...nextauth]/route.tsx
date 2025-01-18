import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Pool } from "pg";

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

// Create a connection pool to PostgreSQL
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT ?? "5432"),
});

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
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username and password must be provided");
        }

        const client = await pool.connect();
        try {
          const res = await client.query(
            "SELECT id, name, email FROM users WHERE username = $1 AND password = crypt($2, password)",
            [credentials.username, credentials.password]
          );

          const user = res.rows[0];

          if (user) {
            // Return user object including the id
            return { id: user.id, name: user.name, email: user.email };
          }
          return null;
        } finally {
          client.release();
        }
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