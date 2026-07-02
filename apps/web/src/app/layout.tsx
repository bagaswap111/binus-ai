import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthProvider from "@/components/auth/session-provider";
import ThemeProvider from "@/components/theme-provider";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BINUS AI — Adaptive Learning Platform",
  description: "AI-powered adaptive learning for K-12 to university",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider><AuthProvider>{children}<Toaster richColors closeButton position="bottom-right" /></AuthProvider></ThemeProvider>
      </body>
    </html>
  );
}
