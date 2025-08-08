import type React from "react";
import { CirclePause, CircleCheck, CircleSlash } from "lucide-react";

interface TagProps {
  label: string;
  icon?: "active" | "inactive" | "paused";
  bgColour: string;
  textColour: string;
  isCompact?: boolean;
  size?: "small" | "medium" | "large";
}

const sizeClasses = {
  withIcon: {
    small: "pl-0.5 pr-2 py-0.5 text-xs rounded-full tracking-wide",
    medium: "px-3.5 py-1 text-sm rounded-full tracking-wide",
    large: "px-4.5 py-1.5 text-base rounded-full tracking-wide",
  },
  withoutIcon: {
    small: "px-2 py-0.5 text-xs rounded-full tracking-wide",
    medium: "px-3 py-1 text-sm rounded-full tracking-wide",
    large: "px-4 py-1.5 text-base rounded-full tracking-wide",
  },
};

export const Tag: React.FC<TagProps> = ({
  label,
  icon,
  bgColour,
  textColour,
  isCompact = false,
  size = "medium",
}) => {
  const isRawColour = bgColour.startsWith("#") || bgColour.startsWith("rgb");

  // Only show minimal mode when both icon and label exist
  const shouldShowMinimal = isCompact && icon && label;

  return (
    <div className="relative inline-flex group">
      <span
        className={`flex items-center gap-1 capitalize ${
          !isRawColour ? bgColour : ""
        } ${textColour} ${
          icon ? sizeClasses.withIcon[size] : sizeClasses.withoutIcon[size]
        } cursor-default`}
        style={isRawColour ? { backgroundColor: bgColour } : undefined}
      >
        {icon && (
          <span className="flex-shrink-0">
            {icon === "active" && <CircleCheck className="size-4" />}
            {icon === "inactive" && <CircleSlash className="size-4" />}
            {icon === "paused" && <CirclePause className="size-4" />}
          </span>
        )}
        {!shouldShowMinimal && <span>{label}</span>}
      </span>

      {/* Tooltip shown only when minimal */}
      {shouldShowMinimal && (
        <div className="capitalize absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded-sm px-2 py-1 whitespace-nowrap pointer-events-none z-10">
          {label}
        </div>
      )}
    </div>
  );
};
