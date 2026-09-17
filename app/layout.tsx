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
        {children}
      </body>
    </html>
  );
}
