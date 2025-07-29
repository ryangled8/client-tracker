import type React from "react";

interface TagProps {
  label: string;
  icon?: React.ReactNode;
  bgColour: string;
  textColour: string;
  isMinimal?: boolean;
  size?: "small" | "medium" | "large";
}

const sizeClasses = {
  small: "px-2 py-0.5 text-xs rounded-md",
  medium: "px-3 py-1 text-sm rounded-lg",
  large: "px-4 py-1.5 text-base rounded-xl",
};

export const Tag: React.FC<TagProps> = ({
  label,
  icon,
  bgColour,
  textColour,
  isMinimal = false,
  size = "medium",
}) => {
  const isRawColour = bgColour.startsWith("#") || bgColour.startsWith("rgb");

  // ✅ Only show minimal mode when both icon and label exist
  const shouldShowMinimal = isMinimal && icon && label;

  return (
    <div className="relative inline-flex group">
      <span
        className={`flex items-center gap-1 ${
          !isRawColour ? bgColour : ""
        } ${textColour} ${sizeClasses[size]} cursor-default`}
        style={isRawColour ? { backgroundColor: bgColour } : undefined}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {!shouldShowMinimal && <span>{label}</span>}
      </span>

      {/* ✅ Tooltip shown only when minimal */}
      {shouldShowMinimal && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap pointer-events-none z-10">
          {label}
        </div>
      )}
    </div>
  );
};

// import type React from "react";

// interface TagProps {
//   label: string;
//   icon?: React.ReactNode;
//   bgColour: string;
//   textColour: string;
//   isMinimal?: boolean;
//   size?: "small" | "medium" | "large";
// }

// const sizeClasses = {
//   small: "px-2 py-0.5 text-xs rounded-md",
//   medium: "px-3 py-1 text-sm rounded-lg",
//   large: "px-4 py-1.5 text-base rounded-xl",
// };

// export const Tag: React.FC<TagProps> = ({
//   label,
//   icon,
//   bgColour,
//   textColour,
//   isMinimal = false,
//   size = "medium",
// }) => {
//   // Only apply minimal if both icon and label exist
//   const shouldShowMinimal = isMinimal && icon && label;

//   return (
//     <div className="relative inline-flex group">
//       <span
//         className={`flex items-center gap-1 ${bgColour} ${textColour} ${sizeClasses[size]} cursor-default`}
//       >
//         {icon && <span className="flex-shrink-0">{icon}</span>}
//         {!shouldShowMinimal && <span>{label}</span>}
//       </span>
//       {/* Tooltip shown only when minimal */}
//       {shouldShowMinimal && (
//         <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap pointer-events-none z-10">
//           {label}
//         </div>
//       )}
//     </div>
//   );
// };
