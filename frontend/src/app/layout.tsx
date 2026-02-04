// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers"; // Privy Provider
import { Web3Provider } from "@/lib/web3Provider"; // Your Existing MetaMask Provider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CropLock: Tokenized Agri-Liquidity",
  description: "Self-custody wallet for digitizing agricultural value chains.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Outer Layer: Privy (Phone Login) */}
        <Providers>
          {/* Inner Layer: Your Web3Provider (MetaMask) */}
          <Web3Provider>
            {children}
          </Web3Provider>
        </Providers>
      </body>
    </html>
  );
}