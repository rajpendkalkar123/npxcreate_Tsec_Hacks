import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/lib/web3Provider";
import { LanguageProvider } from "@/lib/languageContext";

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
  description: "Self-custody wallet for digitizing agricultural value chains through eWR tokenization.",
  icons: {
    icon: "/icon.svg", },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CropLock",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <Web3Provider>
            {children}
          </Web3Provider>
        </LanguageProvider>
      </body>
    </html>
  );
}
