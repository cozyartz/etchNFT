'use client';
import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultConfig,
  RainbowKitProvider,
  ConnectButton,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, useAccount } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mainnet, polygon, base, optimism } from 'wagmi/chains';
import React, { useEffect } from 'react';
type ReactNode = React.ReactNode;

const wagmiConfig = getDefaultConfig({
  appName: 'EtchNFT',
  projectId: import.meta.env.PUBLIC_WALLETCONNECT_PROJECT_ID || 'ETCH_NFT_DAPP', // replace with real WalletConnect Project ID if needed
  chains: [mainnet, polygon, base, optimism],
  ssr: true,
});

const queryClient = new QueryClient();

function ThemeSync({ children }: { children: ReactNode }) {
  return (
    <RainbowKitProvider
      modalSize="compact"
      theme={darkTheme({
        accentColor: '#FF1493',
        accentColorForeground: 'white',
        borderRadius: 'medium',
        fontStack: 'system',
        overlayBlur: 'small',
      })}
    >
      {children}
    </RainbowKitProvider>
  );
}

function WalletWatcher() {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      window.dispatchEvent(
        new CustomEvent('walletConnected', {
          detail: { address },
        })
      );
    }
  }, [isConnected, address]);

  return null;
}

export default function WalletConnectButton() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeSync>
          <WalletWatcher />
          <ConnectButton />
        </ThemeSync>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
