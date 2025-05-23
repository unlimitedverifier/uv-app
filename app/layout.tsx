import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { createSupabaseClient } from "@/utils/supabase/server";

const inter = Inter({ subsets: ["latin"] });

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Update Starter Kit",
  description: "The fastest way to build apps with Next.js and Update",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <Header user={user} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
