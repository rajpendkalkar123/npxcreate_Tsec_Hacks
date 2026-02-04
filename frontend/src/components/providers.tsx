// src/components/providers.tsx
"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { defineChain } from "viem";

const hoodiChain = defineChain({
  id: 560048,
  name: "Hoodi Testnet",
  network: "hoodi",
  nativeCurrency: { decimals: 18, name: "Hoodi Token", symbol: "HOODI" },
  rpcUrls: { default: { http: ["https://rpc-testnet.hoodi.org"] } },
  testnet: true,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        // ✅ UPDATE THIS LINE to include "email"
        loginMethods: ["sms", "email"], 
        supportedChains: [hoodiChain],
        appearance: {
          theme: "light",
          accentColor: "#074d2f",
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}