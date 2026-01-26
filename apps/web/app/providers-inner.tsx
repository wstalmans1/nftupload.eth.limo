"use client";

import { PropsWithChildren, useMemo } from "react";
import { WagmiProvider, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const rpcUrl =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
  "https://rpc.ankr.com/eth_sepolia";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "";

const config = getDefaultConfig({
  appName: "nftupload",
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(rpcUrl)
  },
  ssr: false
});

export function Providers({ children }: PropsWithChildren) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
