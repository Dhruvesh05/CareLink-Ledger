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
      className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-blue-500 hover:-translate-y-1"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            {title}
          </h3>

          <p className="text-gray-500 text-sm">
            {description}
          </p>
        </div>
      </div>

      <div className="text-xl text-blue-600">
        <ArrowRight className="w-5 h-5" />
      </div>
    </div>
  );
};

export default RoleCard;