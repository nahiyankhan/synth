import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ViewOption {
  id: string;
  label: string;
}

interface ViewSwitcherProps {
  currentView: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  { id: "visual-direction", label: "visual direction" },
  { id: "colors", label: "colors" },
  { id: "typography", label: "typography" },
  { id: "sizes", label: "sizes" },
  { id: "components", label: "components" },
  { id: "content", label: "content" },
  { id: "pages", label: "pages" },
];

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentViewLabel = VIEW_OPTIONS.find((v) => v.id === currentView)?.label || currentView;
  const otherViews = VIEW_OPTIONS.filter((v) => v.id !== currentView);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleViewSelect = (viewId: string) => {
    navigate(`/editor/${viewId}`);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm font-mono tracking-tight text-dark-900 hover:text-dark-600 transition-colors"
      >
        <span>{currentViewLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-3.5 h-3.5 transition-all duration-200 ${
            isOpen ? "rotate-180 opacity-100" : "rotate-0"
          } ${isHovered || isOpen ? "opacity-100" : "opacity-0"}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-dark-200 rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          {otherViews.map((view) => (
            <button
              key={view.id}
              onClick={() => handleViewSelect(view.id)}
              className="w-full px-4 py-2.5 text-left text-sm font-mono tracking-tight text-dark-700 hover:bg-dark-50 hover:text-dark-900 transition-colors"
            >
              {view.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

