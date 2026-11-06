import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, Sun, Moon, Network, RefreshCw, TriangleAlert, ChevronDown } from "lucide-react";

import { getDashboardPathByRole, useAuth } from "../auth/AuthContext";
import {
  CARELINK_NETWORKS,
  CARELINK_NETWORK_CHANGED_EVENT,
  getNetworkOption,
  getSelectedChainId,
  setSelectedChainId as persistSelectedChainId,
} from "../api/network";
import { ensureWalletNetwork, getEthereumProvider, getWalletChainId } from "../api/wallet";

const NETWORK_FEEDBACK_STORAGE_KEY = "carelink-network-feedback";

type HeaderProps = {
  onMenuToggle?: () => void;
};

function Header({ onMenuToggle }: HeaderProps) {
  const navigate = useNavigate();
  const { role, user, profile } = useAuth();
  const networkSelectId = useId();
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });
  const [selectedChainId, setSelectedChainIdState] = useState(getSelectedChainId);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(() => {
    return window.sessionStorage.getItem(NETWORK_FEEDBACK_STORAGE_KEY);
  });

  const selectedNetwork = getNetworkOption(selectedChainId) ?? CARELINK_NETWORKS[1];
  const walletNetwork = walletChainId === null ? undefined : getNetworkOption(walletChainId);
  const walletMatchesSelection = walletChainId === selectedChainId;
  const hasInjectedWallet = Boolean(getEthereumProvider());

  useEffect(() => {
    let mounted = true;
    const refreshWalletChain = () => {
      void getWalletChainId()
        .then((chainId) => {
          if (mounted) setWalletChainId(chainId);
          if (chainId === getSelectedChainId()) {
            window.sessionStorage.removeItem(NETWORK_FEEDBACK_STORAGE_KEY);
            if (mounted) setNetworkError(null);
          }
        })
        .catch(() => {
          if (mounted) setWalletChainId(null);
        });
    };

    const syncSelectedNetwork = () => {
      if (mounted) setSelectedChainIdState(getSelectedChainId());
    };

    const provider = getEthereumProvider();
    provider?.on?.("chainChanged", refreshWalletChain);
    provider?.on?.("connect", refreshWalletChain);
    provider?.on?.("accountsChanged", refreshWalletChain);
    window.addEventListener(CARELINK_NETWORK_CHANGED_EVENT, syncSelectedNetwork);
    refreshWalletChain();

    return () => {
      mounted = false;
      provider?.removeListener?.("chainChanged", refreshWalletChain);
      provider?.removeListener?.("connect", refreshWalletChain);
      provider?.removeListener?.("accountsChanged", refreshWalletChain);
      window.removeEventListener(CARELINK_NETWORK_CHANGED_EVENT, syncSelectedNetwork);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("carelink-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("carelink-theme", "light");
    }
  };

  const getRoleName = () => {
    switch (role) {
      case "Patient": return "Patient";
      case "Doctor": return "Doctor";
      case "Hospital": return "Hospital";
      case "Admin": return "Admin";
      default: return "User";
    }
  };

  const getNotificationPath = () => {
    if (role === "Patient") return "/notifications";
    if (role === "Doctor") return "/doctor/notifications";
    if (role === "Hospital") return "/hospital/notifications";
    if (role === "Admin") return "/admin/notifications";
    return "/login";
  };

  const getProfilePath = () => {
    if (role === "Patient") return "/profile";
    if (role === "Doctor") return "/doctor/profile";
    if (role === "Hospital") return "/hospital/profile";
    if (role === "Admin") return "/admin/profile";
    return "/login";
  };

  const applyNetworkAndSwitchWallet = async (chainId: number) => {
    setNetworkError(null);
    try {
      persistSelectedChainId(chainId);
      setSelectedChainIdState(chainId);
      await ensureWalletNetwork(chainId);
      window.sessionStorage.removeItem(NETWORK_FEEDBACK_STORAGE_KEY);
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not switch MetaMask to the selected network.";
      setNetworkError(message);
      window.sessionStorage.setItem(NETWORK_FEEDBACK_STORAGE_KEY, message);
      // Reload so any currently displayed record list is fetched for the new
      // app-selected chain. The persistent message and mismatch indicator make
      // a rejected/missing wallet switch explicit after reload.
      window.location.reload();
    }
  };

  const initials = user?.walletAddress
    ? user.walletAddress.slice(2, 4).toUpperCase()
    : (role ?? "U").slice(0, 1).toUpperCase();
  const pageTitle = window.location.pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") ?? "Dashboard";
  const displayName = profile?.displayName || `${getRoleName()} account`;

  return (
    <header className="sticky top-0 z-30 flex min-h-20 w-full items-center justify-between gap-3 border-b border-[var(--cl-border)] bg-[var(--cl-surface)] px-4 shadow-[var(--cl-shadow)] sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--cl-border)] bg-[var(--cl-surface-muted)] text-[var(--cl-text-secondary)] shadow-sm transition hover:bg-[var(--cl-primary-soft)]"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <button onClick={() => navigate(getDashboardPathByRole(role))} className="min-w-0 text-left focus:outline-none">
          <h2 className="truncate text-xl font-bold capitalize tracking-tight text-[var(--cl-text)] sm:text-2xl">{pageTitle}</h2>
          <p className="mt-0.5 text-xs font-medium text-[var(--cl-text-secondary)] sm:text-sm">{getRoleName()} workspace</p>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3 ml-1">
        <div className="relative flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-2 py-1.5 shadow-sm">
          <Network className="hidden sm:block h-4 w-4 text-cyan-700 dark:text-cyan-300" />
          <div className="flex flex-col">
            <label htmlFor={networkSelectId} className="text-[9px] sm:text-[10px] uppercase tracking-wide font-bold text-slate-500 dark:text-slate-400 leading-tight">
              Blockchain network
            </label>
            <select
              id={networkSelectId}
              value={selectedChainId}
              onChange={(event) => void applyNetworkAndSwitchWallet(Number(event.target.value))}
              className="max-w-[132px] sm:max-w-[158px] bg-transparent text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              aria-label="Select CareLink blockchain network"
            >
              {CARELINK_NETWORKS.map((network) => (
                <option key={network.chainId} value={network.chainId} className="text-slate-900">
                  {network.name}
                </option>
              ))}
            </select>
          </div>
          <span
            className={`hidden lg:inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${walletMatchesSelection ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"}`}
            title={hasInjectedWallet ? `MetaMask: ${walletNetwork?.name ?? (walletChainId === null ? "not connected" : `unsupported chain ${walletChainId}`)}` : "MetaMask not detected"}
          >
            {walletMatchesSelection ? `MetaMask: ${selectedNetwork.networkName}` : "Wallet mismatch"}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--cl-border)] bg-[var(--cl-surface)] text-[var(--cl-text-secondary)] transition hover:bg-[var(--cl-surface-muted)]"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>

        <button
          onClick={() => navigate(getNotificationPath())}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--cl-border)] bg-[var(--cl-surface)] text-[var(--cl-text-secondary)] transition hover:bg-[var(--cl-surface-muted)]"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>

        <button
          onClick={() => navigate(getProfilePath())}
          className="group flex h-10 items-center gap-2 rounded-lg border border-[var(--cl-border)] bg-[var(--cl-surface)] px-2 text-left transition hover:bg-[var(--cl-surface-muted)]"
          title="Profile"
          aria-label="User profile"
        >
          {profile?.avatarDataUrl ? <img src={profile.avatarDataUrl} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DCEFEB] text-xs font-bold text-[#0F6F61]">{initials}</span>}
          <span className="hidden max-w-28 sm:block"><span className="block truncate text-xs font-bold text-[var(--cl-text)]">{displayName}</span><span className="block text-[11px] text-[var(--cl-text-secondary)]">{getRoleName()}</span></span>
          <ChevronDown className="hidden h-4 w-4 text-[var(--cl-text-muted)] sm:block" />
        </button>
      </div>

      {(!walletMatchesSelection || networkError) && (
        <div className="absolute right-3 top-[calc(100%+0.35rem)] z-50 max-w-[min(26rem,calc(100vw-1.5rem))] rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 shadow-lg dark:border-amber-500/30 dark:bg-zinc-900 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">
                {networkError ? "Network switch needs attention" : "MetaMask network mismatch"}
              </p>
              <p className="mt-1 break-words">
                {networkError ?? (hasInjectedWallet
                  ? `CareLink is set to ${selectedNetwork.name}, but MetaMask is on ${walletNetwork?.name ?? (walletChainId === null ? "an unconnected/unknown network" : `chain ${walletChainId}`)}.`
                  : `CareLink is set to ${selectedNetwork.name}. Install or unlock MetaMask before sending transactions.`)}
              </p>
              {hasInjectedWallet && !walletMatchesSelection && (
                <button
                  type="button"
                  onClick={() => void applyNetworkAndSwitchWallet(selectedChainId)}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-200 px-2.5 py-1.5 font-semibold text-amber-950 hover:bg-amber-300 dark:bg-amber-500/20 dark:text-amber-100 dark:hover:bg-amber-500/30"
                >
                  <RefreshCw className="h-3 w-3" /> Switch MetaMask to {selectedNetwork.networkName}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
