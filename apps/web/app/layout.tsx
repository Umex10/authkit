import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AuthKit — drop-in authentication for your next project",
  description:
    "A reusable JWT authentication microservice: Spring Boot backend + Next.js frontend with sign-up, sign-in, refresh tokens, roles, Swagger and tests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", inter.variable)}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <Toaster position="top-right" closeButton />
          {children}
        </Providers>
      </body>
    </html>
  );
}
