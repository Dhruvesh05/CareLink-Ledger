import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface RoleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between bg-white dark:bg-zinc-950/80 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg dark:hover:shadow-cyan-950/20 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 hover:-translate-y-1 group"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
          <Icon className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {title}
          </h3>

          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {description}
          </p>
        </div>
      </div>

      <div className="text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform">
        <ArrowRight className="w-5 h-5" />
      </div>
    </div>
  );
};

export default RoleCard;