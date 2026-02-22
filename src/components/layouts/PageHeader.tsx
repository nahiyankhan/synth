import React from "react";
import { useNavigate } from "react-router-dom";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  segments: BreadcrumbSegment[];
  isVisible?: boolean;
  dark?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  segments,
  isVisible = true,
  dark = false,
}) => {
  const navigate = useNavigate();

  const bgColor = dark ? "bg-dark-900" : "bg-white";
  const activeColor = dark ? "text-dark-50" : "text-dark-900";
  const inactiveColor = "text-dark-400";
  const hoverColor = dark ? "hover:text-dark-50" : "hover:text-dark-900";

  return (
    <div className={`w-full ${bgColor} z-40 shrink-0`}>
      <div
        className={`px-12 pt-12 pb-4 transition-opacity duration-700 ease-out ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const isClickable = !!segment.href;

          return (
            <React.Fragment key={index}>
              {isClickable ? (
                <button
                  onClick={() => navigate(segment.href!)}
                  className={`text-7xl font-bold tracking-tight mr-2 ${inactiveColor} ${hoverColor} transition-colors lowercase`}
                >
                  {segment.label}
                </button>
              ) : (
                <span
                  className={`text-7xl font-bold tracking-tight ${
                    isLast ? activeColor : inactiveColor
                  } lowercase`}
                >
                  {segment.label}
                </span>
              )}
              {!isLast && (
                <span className={`text-7xl font-bold tracking-tight ${inactiveColor} mr-2`}>
                  .
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
