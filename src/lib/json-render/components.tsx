"use client";

/**
 * JSON-Render Component Implementations
 *
 * IMPORTANT: These components are for AI-GENERATED UIs only.
 * They are NOT the shadcn/ui components used by the app itself.
 *
 * Components use x-* classes that are styled by the design language system.
 * The actual styling comes from generated CSS - components are purely structural.
 *
 * See src/lib/json-render/index.ts for full architecture documentation.
 */

import { useState } from "react";
import type { ComponentRegistry, ComponentRenderProps } from "@json-render/react";
import { useData } from "@json-render/react";
import { getByPath } from "@json-render/core";

// =============================================================================
// Utils
// =============================================================================

// Helper to get custom classes from props
export function getCustomClass(props: Record<string, unknown>): string {
  return Array.isArray(props.className)
    ? (props.className as string[]).join(" ")
    : "";
}

// State for interactive components (Select dropdown)
let openSelect: string | null = null;
let setOpenSelect: (v: string | null) => void = () => {};
let selectValues: Record<string, string> = {};
let setSelectValues: (
  fn: (prev: Record<string, string>) => Record<string, string>,
) => void = () => {};

export function useInteractiveState() {
  const [_openSelect, _setOpenSelect] = useState<string | null>(null);
  const [_selectValues, _setSelectValues] = useState<Record<string, string>>(
    {},
  );

  openSelect = _openSelect;
  setOpenSelect = _setOpenSelect;
  selectValues = _selectValues;
  setSelectValues = _setSelectValues;

  return { openSelect, selectValues };
}

export function getOpenSelect() {
  return openSelect;
}

export function setOpenSelectValue(v: string | null) {
  setOpenSelect(v);
}

export function getSelectValue(key: string) {
  return selectValues[key];
}

export function setSelectValueForKey(key: string, value: string) {
  setSelectValues((prev) => ({ ...prev, [key]: value }));
}

// =============================================================================
// Component Registry
// =============================================================================

export const componentRegistry: ComponentRegistry = {
  // ---------------------------------------------------------------------------
  // Layout Components
  // ---------------------------------------------------------------------------

  Card: ({ element, children }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);

    return (
      <div className={`x-card ${customClass}`}>
        {props.title && (
          <div className="x-card-header">{props.title as string}</div>
        )}
        {props.description && (
          <div className="x-card-description">{props.description as string}</div>
        )}
        <div className="x-card-body">{children}</div>
      </div>
    );
  },

  Grid: ({ element, children }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const cols = props.columns === 4
      ? "x-grid-4"
      : props.columns === 3
        ? "x-grid-3"
        : props.columns === 2
          ? "x-grid-2"
          : "";

    return (
      <div className={`x-grid ${cols} ${customClass}`}>
        {children}
      </div>
    );
  },

  Stack: ({ element, children }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const direction = props.direction === "horizontal" ? "x-stack-horizontal" : "x-stack";
    const gap = props.gap === "lg"
      ? "x-stack-gap-lg"
      : props.gap === "sm"
        ? "x-stack-gap-sm"
        : "x-stack-gap-md";

    return (
      <div className={`${direction} ${gap} ${customClass}`}>
        {children}
      </div>
    );
  },

  Divider: ({ element }: ComponentRenderProps) => {
    const customClass = getCustomClass(element.props);
    return <hr className={`x-divider ${customClass}`} />;
  },

  // ---------------------------------------------------------------------------
  // Form Components
  // ---------------------------------------------------------------------------

  Input: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);

    return (
      <div className={customClass}>
        {props.label && (
          <label className="x-label">{props.label as string}</label>
        )}
        <input
          type={(props.type as string) || "text"}
          placeholder={(props.placeholder as string) || ""}
          className="x-input"
        />
      </div>
    );
  },

  Textarea: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const rows = (props.rows as number) || 3;

    return (
      <div className={customClass}>
        {props.label && (
          <label className="x-label">{props.label as string}</label>
        )}
        <textarea
          placeholder={(props.placeholder as string) || ""}
          rows={rows}
          className="x-textarea"
        />
      </div>
    );
  },

  Select: ({ element }: ComponentRenderProps) => {
    const { props, key } = element;
    const customClass = getCustomClass(props);
    const options = (props.options as string[]) || [];
    const selectedValue = getSelectValue(key);
    const isOpen = getOpenSelect() === key;

    return (
      <div className={`relative ${customClass}`}>
        {props.label && (
          <label className="x-label">{props.label as string}</label>
        )}
        <div
          onClick={() => setOpenSelectValue(isOpen ? null : key)}
          className="x-select"
        >
          <span className={selectedValue ? "" : "opacity-50"}>
            {selectedValue || (props.placeholder as string) || "Select..."}
          </span>
          <svg
            className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        {isOpen && options.length > 0 && (
          <div className="x-select-dropdown absolute z-10 top-full left-0 right-0">
            {options.map((opt, i) => (
              <div
                key={i}
                onClick={() => {
                  setSelectValueForKey(key, opt);
                  setOpenSelectValue(null);
                }}
                className={`x-select-option ${selectedValue === opt ? "x-select-option-selected" : ""}`}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },

  Checkbox: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const [checked, setChecked] = useState(!!props.checked);

    return (
      <label
        className={`x-checkbox ${customClass}`}
        onClick={() => setChecked((prev) => !prev)}
      >
        <div className={`x-checkbox-box ${checked ? "x-checkbox-checked" : ""}`}>
          {checked && (
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <span>{props.label as string}</span>
      </label>
    );
  },

  Radio: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const options = (props.options as string[]) || [];
    const [selected, setSelected] = useState(0);

    return (
      <div className={`x-radio ${customClass}`}>
        {props.label && (
          <div className="x-label">{props.label as string}</div>
        )}
        {options.map((opt, i) => (
          <label
            key={i}
            className="x-radio-item"
            onClick={() => setSelected(i)}
          >
            <div className={`x-radio-circle ${selected === i ? "x-radio-checked" : ""}`}>
              {selected === i && <div className="x-radio-dot" />}
            </div>
            <span>{opt}</span>
          </label>
        ))}
      </div>
    );
  },

  Switch: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const [checked, setChecked] = useState(!!props.checked);

    return (
      <label
        className={`x-switch ${customClass}`}
        onClick={() => setChecked((prev) => !prev)}
      >
        <span className="x-switch-label">{props.label as string}</span>
        <div className={`x-switch-track ${checked ? "x-switch-checked" : ""}`}>
          <div className="x-switch-thumb" style={{ transform: checked ? "translateX(100%)" : "translateX(0)" }} />
        </div>
      </label>
    );
  },

  DatePicker: ({ element }: ComponentRenderProps) => {
    const { label, valuePath } = element.props as {
      label: string;
      valuePath: string;
    };
    const { data, set } = useData();
    const value = getByPath(data, valuePath) as string | undefined;

    return (
      <div className="x-datepicker">
        <label className="x-label">{label}</label>
        <input
          type="date"
          value={value ?? ""}
          onChange={(e) => set(valuePath, e.target.value)}
          className="x-datepicker-input"
        />
      </div>
    );
  },

  // ---------------------------------------------------------------------------
  // Action Components
  // ---------------------------------------------------------------------------

  Button: ({ element, onAction, loading }: ComponentRenderProps) => {
    const { label, variant, action, disabled } = element.props as {
      label: string;
      variant?: string | null;
      action: { name: string };
      disabled?: boolean | null;
    };
    const isDisabled = !!disabled || loading;
    const variantClass = `x-btn-${variant || "primary"}`;

    return (
      <button
        onClick={() => !isDisabled && action && onAction?.(action)}
        disabled={isDisabled}
        className={`x-btn ${variantClass} ${isDisabled ? "x-btn-disabled" : ""}`}
      >
        {loading ? "Loading..." : label}
      </button>
    );
  },

  Link: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);

    return (
      <span className={`x-link ${customClass}`}>
        {props.label as string}
      </span>
    );
  },

  // ---------------------------------------------------------------------------
  // Typography Components
  // ---------------------------------------------------------------------------

  Heading: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const level = (props.level as number) || 2;
    const levelClass = `x-heading-${level}`;

    return (
      <div className={`x-heading ${levelClass} ${customClass}`}>
        {props.text as string}
      </div>
    );
  },

  Text: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const variant = props.variant as string;
    const variantClass = variant === "caption"
      ? "x-text-caption"
      : variant === "muted"
        ? "x-text-muted"
        : "x-text";

    return (
      <p className={`${variantClass} ${customClass}`}>
        {props.content as string}
      </p>
    );
  },

  // ---------------------------------------------------------------------------
  // Data Display Components
  // ---------------------------------------------------------------------------

  Image: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const style = {
      width: (props.width as number) || 80,
      height: (props.height as number) || 60,
    };

    return (
      <div className={`x-image ${customClass}`} style={style}>
        {(props.alt as string) || "img"}
      </div>
    );
  },

  Avatar: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const name = (props.name as string) || "?";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const sizeClass = props.size === "lg"
      ? "x-avatar-lg"
      : props.size === "sm"
        ? "x-avatar-sm"
        : "x-avatar-md";

    return (
      <div className={`x-avatar ${sizeClass} ${customClass}`}>
        <span className="x-avatar-initials">{initials}</span>
      </div>
    );
  },

  Badge: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const variant = props.variant as string;
    const variantClass = variant === "success"
      ? "x-badge-success"
      : variant === "warning"
        ? "x-badge-warning"
        : variant === "danger" || variant === "error"
          ? "x-badge-error"
          : "x-badge";

    return (
      <span className={`x-badge ${variantClass} ${customClass}`}>
        {props.text as string}
      </span>
    );
  },

  Alert: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const alertType = props.type as string;
    const typeClass = alertType === "success"
      ? "x-alert-success"
      : alertType === "warning"
        ? "x-alert-warning"
        : alertType === "error"
          ? "x-alert-error"
          : "x-alert-info";

    return (
      <div className={`x-alert ${typeClass} ${customClass}`}>
        <div className="x-alert-title">{props.title as string}</div>
        {props.message && (
          <div className="x-alert-message">{props.message as string}</div>
        )}
      </div>
    );
  },

  Progress: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const value = Math.min(100, Math.max(0, (props.value as number) || 0));

    return (
      <div className={customClass}>
        {props.label && (
          <div className="x-progress-label">{props.label as string}</div>
        )}
        <div className="x-progress">
          <div
            className="x-progress-bar"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  },

  Rating: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const ratingValue = (props.value as number) || 0;
    const maxRating = (props.max as number) || 5;

    return (
      <div className={`x-rating ${customClass}`}>
        {props.label && (
          <div className="x-rating-label">{props.label as string}</div>
        )}
        <div className="flex gap-0.5">
          {Array.from({ length: maxRating }).map((_, i) => (
            <span
              key={i}
              className={`x-rating-star ${i < ratingValue ? "x-rating-star-filled" : "x-rating-star-empty"}`}
            >
              ★
            </span>
          ))}
        </div>
      </div>
    );
  },

  BarGraph: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const data = (props.data as Array<{ label: string; value: number }>) || [];
    const title = props.title as string | undefined;
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    return (
      <div className={`x-bargraph ${customClass}`}>
        {title && <div className="x-bargraph-title">{title}</div>}
        <div className="x-bargraph-bars">
          {data.map((d, i) => (
            <div key={i} className="x-bargraph-bar-container">
              <div className="x-bargraph-bar-value">{d.value}</div>
              <div className="x-bargraph-bar-wrapper">
                <div
                  className="x-bargraph-bar"
                  style={{
                    height: `${(d.value / maxValue) * 100}%`,
                    minHeight: 2,
                  }}
                />
              </div>
              <div className="x-bargraph-bar-label">{d.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  },

  LineGraph: ({ element }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);
    const data = (props.data as Array<{ label: string; value: number }>) || [];
    const title = props.title as string | undefined;
    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const range = maxValue - minValue || 1;

    const width = 300;
    const height = 100;
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = data.map((d, i) => {
      const x =
        padding.left +
        (data.length > 1 ? (i / (data.length - 1)) * chartWidth : chartWidth / 2);
      const y =
        padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
      return { x, y, ...d };
    });

    const pathD =
      points.length > 0
        ? `M ${points.map((p) => `${p.x} ${p.y}`).join(" L ")}`
        : "";

    return (
      <div className={`x-linegraph ${customClass}`}>
        {title && <div className="x-linegraph-title">{title}</div>}
        <div className="x-linegraph-svg">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            {/* Grid lines */}
            <line
              x1={padding.left}
              y1={padding.top + chartHeight / 2}
              x2={width - padding.right}
              y2={padding.top + chartHeight / 2}
              className="x-linegraph-grid"
            />
            <line
              x1={padding.left}
              y1={padding.top}
              x2={width - padding.right}
              y2={padding.top}
              className="x-linegraph-grid"
            />
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              className="x-linegraph-grid"
            />
            {/* Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                className="x-linegraph-line"
              />
            )}
            {/* Points */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                className="x-linegraph-point"
              />
            ))}
          </svg>
        </div>
        {data.length > 0 && (
          <div className="x-linegraph-labels">
            {data.map((d, i) => (
              <div key={i} className="x-linegraph-label">
                {d.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },

  // ---------------------------------------------------------------------------
  // Dashboard Data Components (data binding)
  // ---------------------------------------------------------------------------

  Metric: ({ element }: ComponentRenderProps) => {
    const { label, valuePath, format, trend, trendValue } = element.props as {
      label: string;
      valuePath: string;
      format?: string | null;
      trend?: string | null;
      trendValue?: string | null;
    };

    const { data } = useData();
    const rawValue = getByPath(data, valuePath);

    let displayValue = String(rawValue ?? "-");
    if (format === "currency" && typeof rawValue === "number") {
      displayValue = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(rawValue);
    } else if (format === "percent" && typeof rawValue === "number") {
      displayValue = new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 1,
      }).format(rawValue);
    } else if (format === "number" && typeof rawValue === "number") {
      displayValue = new Intl.NumberFormat("en-US").format(rawValue);
    }

    const trendClass = trend === "up"
      ? "x-metric-trend-up"
      : trend === "down"
        ? "x-metric-trend-down"
        : "x-metric-trend";

    return (
      <div className="x-metric">
        <span className="x-metric-label">{label}</span>
        <span className="x-metric-value">{displayValue}</span>
        {(trend || trendValue) && (
          <span className={trendClass}>
            {trend === "up" ? "+" : trend === "down" ? "-" : ""}
            {trendValue}
          </span>
        )}
      </div>
    );
  },

  Chart: ({ element }: ComponentRenderProps) => {
    const { title, dataPath } = element.props as {
      title?: string | null;
      dataPath: string;
    };
    const { data } = useData();
    const chartData = getByPath(data, dataPath) as
      | Array<{ label: string; value: number }>
      | undefined;

    if (!chartData || !Array.isArray(chartData)) {
      return <div className="x-empty">No data</div>;
    }

    const maxValue = Math.max(...chartData.map((d) => d.value));

    return (
      <div className="x-chart">
        {title && <h4 className="x-chart-title">{title}</h4>}
        <div className="x-chart-bars">
          {chartData.map((d, i) => (
            <div key={i} className="x-chart-bar-container">
              <div
                className="x-chart-bar"
                style={{ height: `${(d.value / maxValue) * 100}%` }}
              />
              <span className="x-chart-bar-label">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },

  Table: ({ element }: ComponentRenderProps) => {
    const { title, dataPath, columns } = element.props as {
      title?: string | null;
      dataPath: string;
      columns: Array<{ key: string; label: string; format?: string | null }>;
    };

    const { data } = useData();
    const tableData = getByPath(data, dataPath) as
      | Array<Record<string, unknown>>
      | undefined;

    if (!tableData || !Array.isArray(tableData)) {
      return <div className="x-empty">No data</div>;
    }

    const formatCell = (value: unknown, format?: string | null) => {
      if (value === null || value === undefined) return "-";
      if (format === "currency" && typeof value === "number") {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value);
      }
      if (format === "date" && typeof value === "string") {
        return new Date(value).toLocaleDateString();
      }
      if (format === "badge") {
        return <span className="x-table-badge">{String(value)}</span>;
      }
      return String(value);
    };

    return (
      <div className="x-table">
        {title && <h4 className="x-table-title">{title}</h4>}
        <table>
          <thead className="x-table-header">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="x-table-th">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="x-table-body">
            {tableData.map((row, i) => (
              <tr key={i} className="x-table-row">
                {columns.map((col) => (
                  <td key={col.key} className="x-table-td">
                    {formatCell(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },

  List: ({ element, children }: ComponentRenderProps) => {
    const { dataPath } = element.props as { dataPath: string };
    const { data } = useData();
    const listData = getByPath(data, dataPath) as Array<unknown> | undefined;

    if (!listData || !Array.isArray(listData)) {
      return <div className="x-empty">No items</div>;
    }

    return <div className="x-list">{children}</div>;
  },

  Empty: ({ element }: ComponentRenderProps) => {
    const { title, description } = element.props as {
      title: string;
      description?: string | null;
    };

    return (
      <div className="x-empty">
        <h3 className="x-empty-title">{title}</h3>
        {description && (
          <p className="x-empty-description">{description}</p>
        )}
      </div>
    );
  },

  Form: ({ element, children }: ComponentRenderProps) => {
    const { props } = element;
    const customClass = getCustomClass(props);

    return (
      <div className={`x-form ${customClass}`}>
        {props.title && (
          <div className="x-form-title">{props.title as string}</div>
        )}
        <div className="x-card-body">{children}</div>
      </div>
    );
  },
};

// =============================================================================
// Fallback Component
// =============================================================================

export const FallbackComponent: React.FC<ComponentRenderProps> = ({ element }) => {
  const customClass = getCustomClass(element.props);
  return (
    <div className={`x-text-muted ${customClass}`}>
      [{element.type}]
    </div>
  );
};
