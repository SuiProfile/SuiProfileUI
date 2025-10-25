import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrimeReactProvider } from "@primereact/core/config";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { networkConfig, defaultNetwork } from "../config/networkConfig";
import { primeTheme } from "../config/theme";

const queryClient = new QueryClient();

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <PrimeReactProvider value={primeTheme}>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork={defaultNetwork}>
          <WalletProvider autoConnect>
            {children}
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </PrimeReactProvider>
  );
}
