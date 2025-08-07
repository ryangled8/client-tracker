import React from "react";

interface CSVStepCardProps {
  title: string;
  description: string;
  stepCount: number;
}

export const CSVStepCard: React.FC<CSVStepCardProps> = ({
  title,
  description,
  stepCount,
}) => {
  return (
    <div className="border rounded-sm p-8 bg-[#F9FAFC] w-1/3">
      <span className="rounded-full size-7 text-xs f-hm grid place-items-center bg-blk text-white mx-auto">
        {stepCount}
      </span>

      <div className="mt-6 flex flex-col items-center text-center">
        <h3 className="text-xl f-hr leading-none">{title}</h3>

        <p className="text-xs text-blk-60 mt-2">{description}</p>
      </div>
    </div>
  );
};
