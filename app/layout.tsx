import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Background } from "@/components/Background";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "stuzzy",
  description: "See when everyone is free.",
};

export const viewport: Viewport = {
  // Lets the bottom sheet pad itself past the home indicator via env(safe-area-inset-bottom).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0b16" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full">
        <Background />
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
