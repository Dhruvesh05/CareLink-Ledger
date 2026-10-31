import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import type { LucideIcon } from "lucide-react";

export type SidebarItem = { title: string; icon: LucideIcon; path: string };

type RoleSidebarProps = {
  roleLabel: string;
  items: SidebarItem[];
  accent?: "teal" | "green" | "indigo" | "cyan";
};

const accentClasses = {
  teal: "bg-[#E4F4F0] text-[#0F6F61]",
  green: "bg-emerald-50 text-emerald-700",
  indigo: "bg-indigo-50 text-indigo-700",
  cyan: "bg-cyan-50 text-cyan-700",
};

export default function RoleSidebar({ roleLabel, items, accent = "teal" }: RoleSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, profile, user } = useAuth();

  return (
    <aside className="flex h-screen w-full flex-col border-r border-[#E4E8EC] bg-white text-[#17212F] md:w-72">
      <div className="flex-shrink-0 border-b border-[#E4E8EC] px-6 py-5">
        <button type="button" onClick={() => navigate(items[0]?.path ?? "/")} className="flex items-center gap-3 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F8B78] text-sm font-black text-white shadow-sm">CL</span>
          <span>
            <span className="block text-lg font-bold tracking-tight">CareLink</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#697586]">Ledger</span>
          </span>
        </button>
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#F5F7F8] px-3 py-2.5">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentClasses[accent]}`}>
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{roleLabel} workspace</p>
            <p className="truncate text-[11px] text-[#697586]">Secure portal</p>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5" aria-label={`${roleLabel} navigation`}>
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9AA4B2]">Workspace</p>
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                type="button"
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  active ? accentClasses[accent] : "text-[#697586] hover:bg-[#F5F7F8] hover:text-[#17212F]"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{item.title}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-[#E4E8EC] p-4">
        <button type="button" onClick={() => { logout(); navigate("/login"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#697586] transition-colors hover:bg-rose-50 hover:text-rose-700">
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
        <div className="mt-3 flex items-center gap-3 border-t border-[#E4E8EC] pt-3">
          {profile?.avatarDataUrl ? <img src={profile.avatarDataUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCEFEB] text-xs font-bold text-[#0F6F61]">{(profile?.displayName ?? user?.walletAddress ?? roleLabel).slice(0, 2).toUpperCase()}</span>}
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{profile?.displayName || "Authenticated user"}</p>
            <p className="truncate text-[11px] text-[#697586]">{roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
