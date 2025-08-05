import Link from "next/link";
import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ButtonRoundedProps {
  variant?: "primary" | "outline";
  url: string;
  icon: string;
  size: "sm" | "md" | "lg";
}

export const ButtonRounded: React.FC<ButtonRoundedProps> = ({
  variant,
  url,
  icon,
  size,
}) => {
  return (
    <Link
      href={url}
      className={`
        rounded-full grid place-items-center
        ${variant === "primary" && "bg-blk text-white"}
        ${variant === "outline" && "bg-white text-blk border border-gray-400"}

        ${size === "sm" && "size-6"}
        ${size === "md" && "size-8"}
        ${size === "lg" && "size-10"}
      `}
    >
      {icon === "ArrowLeft" && (
        <ArrowLeft
          className={`
              ${size === "sm" && "size-3"}
              ${size === "md" && "size-4"}
              ${size === "lg" && "size-6"}
            `}
        />
      )}

      {icon === "ArrowRight" && (
        <ArrowRight
          className={`
              ${size === "sm" && "size-3"}
              ${size === "md" && "size-4"}
              ${size === "lg" && "size-6"}
            `}
        />
      )}
    </Link>
  );
};
