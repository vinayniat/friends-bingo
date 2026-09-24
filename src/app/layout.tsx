import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FRIENDS BINGO — Arrange. Call. Complete. BINGO!",
  description:
    "Real-time multiplayer 5x5 Bingo game. Arrange numbers 1–25, take turns calling numbers, and complete 5 unique lines to spell B-I-N-G-O and win.",
  keywords: ["bingo", "multiplayer bingo", "friends bingo", "real-time game", "nextjs"],
  authors: [{ name: "Friends Bingo" }],
  openGraph: {
    title: "FRIENDS BINGO — Arrange. Call. Complete. BINGO!",
    description: "Multiplayer 5x5 custom rules Bingo for friends and family.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F9FC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F7F9FC] text-slate-800 font-sans">
        {children}
      </body>
    </html>
  );
}
