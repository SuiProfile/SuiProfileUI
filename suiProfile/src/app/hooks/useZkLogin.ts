import { useState, useEffect } from 'react';
import { useConnectWallet, useCurrentAccount, useWallets, useDisconnectWallet } from '@mysten/dapp-kit';
import { isGoogleWallet, isEnokiWallet } from '@mysten/enoki';
import { ZkLoginUser } from '../models/zk-login-user';
import { ZkLoginReturn } from '../models/zk-login-return';

export function useZkLogin(): ZkLoginReturn {
  const [user, setUser] = useState<ZkLoginUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Enoki hooks
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const wallets = useWallets();

  // Find Google wallet from Enoki
  const googleWallet =
    wallets.find((w) => isGoogleWallet(w) || isEnokiWallet(w)) ??
    wallets.find((w) => {
      const n = w.name.toLowerCase();
      return n.includes('enoki') || n.includes('google') || n.includes('zklogin');
    });

  // Debug: Log available wallets
  useEffect(() => {
    console.log('Available wallets:', wallets.map(w => ({ name: w.name })));
    console.log('Google wallet found:', googleWallet?.name);
  }, [wallets, googleWallet]);

  // Check if user is already logged in via Enoki or regular wallet
  useEffect(() => {
    if (currentAccount) {
      // Check if it's an Enoki wallet
      const isEnoki = wallets.find(w => w.accounts[0]?.address === currentAccount.address && isEnokiWallet(w));

      if (isEnoki) {
        // User is connected via Enoki
        const zkLoginUser: ZkLoginUser = {
          address: currentAccount.address,
          email: 'user@example.com', // Enoki doesn't expose email directly
          name: 'Enoki User',
          picture: undefined,
          jwt: 'enoki-jwt-token',
        };

        setUser(zkLoginUser);
        setIsAuthenticated(true);
        localStorage.setItem('zklogin_user', JSON.stringify(zkLoginUser));
      } else {
        // User is connected via regular wallet
        const walletUser: ZkLoginUser = {
          address: currentAccount.address,
          email: 'wallet@example.com',
          name: 'Wallet User',
          picture: undefined,
          jwt: 'wallet-token',
        };

        setUser(walletUser);
        setIsAuthenticated(true);
        localStorage.setItem('zklogin_user', JSON.stringify(walletUser));
      }
    } else {
      // Clear any saved user data if not connected
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('zklogin_user');
    }
  }, [currentAccount, wallets]);

  async function waitForAccount(timeoutMs = 8000): Promise<string | null> {
    const started = Date.now();
    return new Promise((resolve) => {
      const iv = setInterval(() => {
        const acc = currentAccount?.address ?? null;
        if (acc) {
          clearInterval(iv);
          resolve(acc);
        } else if (Date.now() - started > timeoutMs) {
          clearInterval(iv);
          resolve(null);
        }
      }, 150);
    });
  }

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      let targetWallet =
        wallets.find((w) => isGoogleWallet(w) || isEnokiWallet(w)) ??
        wallets.find((w) => {
          const n = w.name.toLowerCase();
          return n.includes('enoki') || n.includes('google') || n.includes('zklogin');
        });

      if (!targetWallet) {
        // ✅ Daha açıklayıcı mesaj
        throw new Error(
          `No Google/Enoki wallet found. Currently detected wallets: ` +
          wallets.map((w) => w.name).join(', ') +
          `. Please install and enable the Enoki Wallet, then try again.`
        );
      }

      await connect({ wallet: targetWallet });

      const addr = await waitForAccount(8000);
      if (!addr) {
        throw new Error('Wallet connected, but no account was detected (timeout). Please try again.');
      }

      const enokiSelected = isGoogleWallet(targetWallet) || isEnokiWallet(targetWallet);
      const zkLoginUser: ZkLoginUser = {
        address: addr,
        email: enokiSelected ? 'user@example.com' : 'wallet@example.com',
        name: enokiSelected ? 'Google User' : 'Wallet User',
        picture: undefined,
        jwt: enokiSelected ? 'enoki-jwt-token' : 'wallet-token',
      };

      setUser(zkLoginUser);
      setIsAuthenticated(true);
      localStorage.setItem('zklogin_user', JSON.stringify(zkLoginUser));
    } catch (err) {
      console.error('Enoki login error:', err);
      alert(`Login failed: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };


  const logout = () => {
    console.log('Logging out user...');

    // Disconnect from all wallets first
    if (currentAccount) {
      console.log('Disconnecting from wallet...');
      disconnect();
    }

    // Clear user state
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('zklogin_user');

    console.log('Logout completed, isAuthenticated:', false);
  };

  const getAddress = () => {
    return user?.address || null;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    loginWithGoogle,
    logout,
    getAddress,
  };
}
