// src/components/providers.tsx
"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { defineChain } from "viem";

const hoodiChain = defineChain({
  id: Number(process.env.NEXT_PUBLIC_HOODI_CHAIN_ID) || 560048,
  name: "Hoodi Testnet",
  network: "hoodi",
  nativeCurrency: { decimals: 18, name: "Hoodi Token", symbol: "HOODI" },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_HOODI_RPC_URL || "https://ethereum-hoodi-rpc.publicnode.com"] } },
  testnet: true,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        // Only email and wallet - no SMS/phone number
        loginMethods: ["email", "wallet"], 
        supportedChains: [hoodiChain],
        appearance: {
          theme: "light",
          accentColor: "#074d2f",
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}