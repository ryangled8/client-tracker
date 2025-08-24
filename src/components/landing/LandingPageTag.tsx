import React from "react";

interface LandingPageTagProps {
  label: string;
}

export const LandingPageTag: React.FC<LandingPageTagProps> = ({ label }) => {
  return (
    <div className="flex items-center gap-1">
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="15" height="15" rx="7.5" fill="#1C1D22" />
        <path
          d="M4.28571 7.49999H7.49999M7.49999 7.49999H10.7143M7.49999 7.49999V10.7143M7.49999 7.49999V4.28571"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {label}
    </div>
  );
};
