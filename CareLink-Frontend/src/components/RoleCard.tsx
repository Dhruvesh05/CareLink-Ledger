interface RoleCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

const RoleCard = ({
  icon,
  title,
  description,
  onClick,
}: RoleCardProps) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-blue-500 hover:-translate-y-1"
    >
      <div className="flex items-center gap-4">
        <div className="text-4xl">{icon}</div>

        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            {title}
          </h3>

          <p className="text-gray-500 text-sm">
            {description}
          </p>
        </div>
      </div>

      <div className="text-2xl text-blue-600">
        →
      </div>
    </div>
  );
};

export default RoleCard;