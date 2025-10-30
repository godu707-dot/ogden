"use client"
import React, { useState } from "react";

import { ethers } from 'ethers';

export function useMetaMask() {
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);

  const connect = async () => {
    setConnecting(true);
    setError(null);
    try {
      if (!window.ethereum) {
        setError("MetaMask not found. Please install MetaMask.");
        setConnecting(false);
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);

      // Create ethers provider
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(ethersProvider);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });

      // Listen for chain changes
      window.ethereum.removeListener('chainChanged', () => {});
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    } catch (err: any) {
      setError(err?.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  return { account, connect, error, connecting, provider };
}

export default function MetaMaskConnectButton({ className = "" }: { className?: string }) {
  const { account, connect, error, connecting } = useMetaMask();
  return (
    <div className={className}>
      {account ? (
        <span className="text-green-600 font-mono">Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
      ) : (
        <button 
          onClick={connect} 
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md" 
          disabled={connecting}
        >
          {connecting ? "Connecting..." : "Connect MetaMask"}
        </button>
      )}
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
}