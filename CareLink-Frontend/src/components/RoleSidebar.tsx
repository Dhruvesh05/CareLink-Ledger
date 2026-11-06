import { useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import type { LucideIcon } from "lucide-react";

export type SidebarItem = { title: string; icon: LucideIcon; path: string };

type RoleSidebarProps = {
  roleLabel: string;
  items: SidebarItem[];
  accent?: "teal" | "green" | "indigo" | "cyan";
};

const accentClasses = {
  teal: "bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]",
  green: "bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]",
  indigo: "bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]",
  cyan: "bg-[var(--cl-primary-soft)] text-[var(--cl-primary)]",
};

export default function RoleSidebar({ roleLabel, items, accent = "teal" }: RoleSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, profile, user } = useAuth();

  return (
    <aside className="flex h-screen w-full flex-col bg-[var(--cl-surface)] text-[var(--cl-text)] md:w-72">
      <div className="flex-shrink-0 border-b border-[var(--cl-border)] px-6 py-5">
        <button type="button" onClick={() => navigate(items[0]?.path ?? "/")} className="flex items-center gap-3 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cl-primary)] text-sm font-black text-white shadow-sm">CL</span>
          <span>
            <span className="block text-lg font-bold tracking-tight">CareLink</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cl-text-muted)]">Ledger</span>
          </span>
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5" aria-label={`${roleLabel} navigation`}>
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                type="button"
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  active ? `${accentClasses[accent]} shadow-sm` : "text-[var(--cl-text-secondary)] hover:bg-[var(--cl-surface-muted)] hover:text-[var(--cl-text)]"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{item.title}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-[var(--cl-border)] p-4">
        <button type="button" onClick={() => { logout(); navigate("/login"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--cl-text-secondary)] transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10 dark:hover:text-red-300">
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
        <div className="mt-3 flex items-center gap-3 border-t border-[var(--cl-border)] pt-3">
          {profile?.avatarDataUrl ? <img src={profile.avatarDataUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCEFEB] text-xs font-bold text-[#0F6F61]">{(profile?.displayName ?? user?.walletAddress ?? roleLabel).slice(0, 2).toUpperCase()}</span>}
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{profile?.displayName || "Authenticated user"}</p>
            <p className="truncate text-[11px] text-[var(--cl-text-secondary)]">{roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
