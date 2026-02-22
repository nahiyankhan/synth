/**
 * ComponentsView - JSON-Render Component Catalog
 *
 * Displays all components from the json-render catalog with sample data.
 * Has its own light/dark mode toggle independent of the global app theme.
 */

import React, { useState } from "react";
import { StyleGraph } from "../core/StyleGraph";
import { StyleMode } from "../types/styleGraph";
import { Renderer, JSONUIProvider } from "@json-render/react";
import {
  componentRegistry,
  FallbackComponent,
  useInteractiveState,
} from "../lib/json-render";

interface ComponentsViewProps {
  graph: StyleGraph;
  viewMode: StyleMode;
}

type PreviewMode = "light" | "dark";

// Sample data for data-bound components
const sampleData = {
  analytics: {
    revenue: 125000,
    users: 8420,
    conversion: 0.032,
  },
  chart: [
    { label: "Jan", value: 30 },
    { label: "Feb", value: 45 },
    { label: "Mar", value: 28 },
    { label: "Apr", value: 62 },
    { label: "May", value: 55 },
  ],
  users: [
    { name: "Alice", email: "alice@example.com", status: "Active", amount: 250 },
    { name: "Bob", email: "bob@example.com", status: "Pending", amount: 150 },
    { name: "Carol", email: "carol@example.com", status: "Active", amount: 320 },
  ],
  items: ["Item 1", "Item 2", "Item 3"],
  selectedDate: "2024-01-15",
};

// Component example with optional variant info
interface ComponentExample {
  variantKey?: string;
  variantValue?: string | number;
  element: { type: string; props: Record<string, unknown>; children?: unknown[] };
}

// All component examples organized by category
const componentExamples: { category: string; components: { name: string; examples: ComponentExample[] }[] }[] = [
  {
    category: "Layout",
    components: [
      {
        name: "Card",
        examples: [
          { variantKey: "maxWidth", variantValue: "sm", element: { type: "Card", props: { title: "Small Card", maxWidth: "sm" }, children: [{ type: "Text", props: { content: "Compact content" }, key: "t1" }] } },
          { variantKey: "maxWidth", variantValue: "md", element: { type: "Card", props: { title: "Medium Card", description: "With description", maxWidth: "md" }, children: [{ type: "Text", props: { content: "More content space" }, key: "t1" }] } },
        ],
      },
      {
        name: "Grid",
        examples: [
          { variantKey: "columns", variantValue: 2, element: { type: "Grid", props: { columns: 2, gap: "md" }, children: [{ type: "Badge", props: { text: "A" }, key: "g1" }, { type: "Badge", props: { text: "B" }, key: "g2" }] } },
          { variantKey: "columns", variantValue: 3, element: { type: "Grid", props: { columns: 3, gap: "sm" }, children: [{ type: "Badge", props: { text: "1" }, key: "g1" }, { type: "Badge", props: { text: "2" }, key: "g2" }, { type: "Badge", props: { text: "3" }, key: "g3" }] } },
        ],
      },
      {
        name: "Stack",
        examples: [
          { variantKey: "direction", variantValue: "horizontal", element: { type: "Stack", props: { direction: "horizontal", gap: "md" }, children: [{ type: "Badge", props: { text: "A" }, key: "s1" }, { type: "Badge", props: { text: "B" }, key: "s2" }] } },
          { variantKey: "direction", variantValue: "vertical", element: { type: "Stack", props: { direction: "vertical", gap: "sm" }, children: [{ type: "Badge", props: { text: "Top" }, key: "s1" }, { type: "Badge", props: { text: "Bottom" }, key: "s2" }] } },
        ],
      },
      { name: "Divider", examples: [{ element: { type: "Divider", props: {} } }] },
    ],
  },
  {
    category: "Actions",
    components: [
      {
        name: "Button",
        examples: [
          { variantKey: "variant", variantValue: "primary", element: { type: "Button", props: { label: "Primary", variant: "primary", action: { name: "click" } } } },
          { variantKey: "variant", variantValue: "secondary", element: { type: "Button", props: { label: "Secondary", variant: "secondary", action: { name: "click" } } } },
          { variantKey: "variant", variantValue: "danger", element: { type: "Button", props: { label: "Danger", variant: "danger", action: { name: "click" } } } },
          { variantKey: "variant", variantValue: "ghost", element: { type: "Button", props: { label: "Ghost", variant: "ghost", action: { name: "click" } } } },
        ],
      },
      { name: "Link", examples: [{ element: { type: "Link", props: { label: "Learn more →", href: "#" } } }] },
    ],
  },
  {
    category: "Form Inputs",
    components: [
      {
        name: "Input",
        examples: [
          { variantKey: "type", variantValue: "text", element: { type: "Input", props: { label: "Name", name: "name", type: "text", placeholder: "Enter name" } } },
          { variantKey: "type", variantValue: "email", element: { type: "Input", props: { label: "Email", name: "email", type: "email", placeholder: "you@example.com" } } },
          { variantKey: "type", variantValue: "password", element: { type: "Input", props: { label: "Password", name: "password", type: "password", placeholder: "••••••••" } } },
        ],
      },
      { name: "Textarea", examples: [{ element: { type: "Textarea", props: { label: "Message", name: "message", placeholder: "Type your message", rows: 3 } } }] },
      { name: "Select", examples: [{ element: { type: "Select", props: { label: "Country", options: ["USA", "Canada", "UK", "Germany"], placeholder: "Select country" } } }] },
      { name: "Checkbox", examples: [{ element: { type: "Checkbox", props: { label: "I agree to the terms", name: "terms" } } }] },
      { name: "Radio", examples: [{ element: { type: "Radio", props: { label: "Size", name: "size", options: ["Small", "Medium", "Large"] } } }] },
      { name: "Switch", examples: [{ element: { type: "Switch", props: { label: "Enable notifications", name: "notifications" } } }] },
      { name: "DatePicker", examples: [{ element: { type: "DatePicker", props: { label: "Start Date", valuePath: "/selectedDate" } } }] },
    ],
  },
  {
    category: "Typography",
    components: [
      {
        name: "Heading",
        examples: [
          { variantKey: "level", variantValue: 1, element: { type: "Heading", props: { text: "Heading 1", level: 1 } } },
          { variantKey: "level", variantValue: 2, element: { type: "Heading", props: { text: "Heading 2", level: 2 } } },
          { variantKey: "level", variantValue: 3, element: { type: "Heading", props: { text: "Heading 3", level: 3 } } },
          { variantKey: "level", variantValue: 4, element: { type: "Heading", props: { text: "Heading 4", level: 4 } } },
        ],
      },
      {
        name: "Text",
        examples: [
          { variantKey: "variant", variantValue: "body", element: { type: "Text", props: { content: "Body text for paragraphs and content.", variant: "body" } } },
          { variantKey: "variant", variantValue: "caption", element: { type: "Text", props: { content: "Caption text for labels", variant: "caption" } } },
          { variantKey: "variant", variantValue: "muted", element: { type: "Text", props: { content: "Muted helper text", variant: "muted" } } },
        ],
      },
    ],
  },
  {
    category: "Data Display",
    components: [
      {
        name: "Badge",
        examples: [
          { variantKey: "variant", variantValue: "default", element: { type: "Badge", props: { text: "Default", variant: "default" } } },
          { variantKey: "variant", variantValue: "success", element: { type: "Badge", props: { text: "Success", variant: "success" } } },
          { variantKey: "variant", variantValue: "warning", element: { type: "Badge", props: { text: "Warning", variant: "warning" } } },
          { variantKey: "variant", variantValue: "danger", element: { type: "Badge", props: { text: "Danger", variant: "danger" } } },
          { variantKey: "variant", variantValue: "info", element: { type: "Badge", props: { text: "Info", variant: "info" } } },
        ],
      },
      {
        name: "Alert",
        examples: [
          { variantKey: "type", variantValue: "info", element: { type: "Alert", props: { type: "info", title: "Info", message: "Informational message" } } },
          { variantKey: "type", variantValue: "success", element: { type: "Alert", props: { type: "success", title: "Success", message: "Operation completed" } } },
          { variantKey: "type", variantValue: "warning", element: { type: "Alert", props: { type: "warning", title: "Warning", message: "Please review" } } },
          { variantKey: "type", variantValue: "error", element: { type: "Alert", props: { type: "error", title: "Error", message: "Something went wrong" } } },
        ],
      },
      {
        name: "Avatar",
        examples: [
          { variantKey: "size", variantValue: "sm", element: { type: "Avatar", props: { name: "John Doe", size: "sm" } } },
          { variantKey: "size", variantValue: "md", element: { type: "Avatar", props: { name: "Jane Smith", size: "md" } } },
          { variantKey: "size", variantValue: "lg", element: { type: "Avatar", props: { name: "Bob Wilson", size: "lg" } } },
        ],
      },
      {
        name: "Metric",
        examples: [
          { variantKey: "format", variantValue: "currency", element: { type: "Metric", props: { label: "Revenue", valuePath: "/analytics/revenue", format: "currency", trend: "up", trendValue: "+12%" } } },
          { variantKey: "format", variantValue: "number", element: { type: "Metric", props: { label: "Users", valuePath: "/analytics/users", format: "number", trend: "down", trendValue: "-5%" } } },
          { variantKey: "format", variantValue: "percent", element: { type: "Metric", props: { label: "Conversion", valuePath: "/analytics/conversion", format: "percent" } } },
        ],
      },
      { name: "Progress", examples: [
        { variantKey: "value", variantValue: 25, element: { type: "Progress", props: { value: 25, label: "Loading" } } },
        { variantKey: "value", variantValue: 65, element: { type: "Progress", props: { value: 65, label: "Progress" } } },
        { variantKey: "value", variantValue: 100, element: { type: "Progress", props: { value: 100, label: "Complete" } } },
      ] },
      { name: "Rating", examples: [
        { variantKey: "value", variantValue: 3, element: { type: "Rating", props: { value: 3, max: 5, label: "Rating" } } },
        { variantKey: "value", variantValue: 5, element: { type: "Rating", props: { value: 5, max: 5, label: "Perfect" } } },
      ] },
      { name: "BarGraph", examples: [{ element: { type: "BarGraph", props: { title: "Quarterly", data: [{ label: "Q1", value: 30 }, { label: "Q2", value: 45 }, { label: "Q3", value: 28 }, { label: "Q4", value: 52 }] } } }] },
      { name: "LineGraph", examples: [{ element: { type: "LineGraph", props: { title: "Weekly Trend", data: [{ label: "Mon", value: 10 }, { label: "Tue", value: 25 }, { label: "Wed", value: 18 }, { label: "Thu", value: 32 }, { label: "Fri", value: 28 }] } } }] },
      { name: "Chart", examples: [{ element: { type: "Chart", props: { title: "Monthly Sales", dataPath: "/chart", type: "bar" } } }] },
      {
        name: "Table",
        examples: [{
          element: {
            type: "Table",
            props: {
              title: "Users",
              dataPath: "/users",
              columns: [
                { key: "name", label: "Name" },
                { key: "status", label: "Status", format: "badge" },
                { key: "amount", label: "Amount", format: "currency" },
              ],
            },
          },
        }],
      },
      { name: "Image", examples: [{ element: { type: "Image", props: { src: "/placeholder.jpg", alt: "Placeholder", width: 120, height: 80 } } }] },
      { name: "Empty", examples: [{ element: { type: "Empty", props: { title: "No data", description: "There are no items to display." } } }] },
    ],
  },
  {
    category: "Utility",
    components: [
      {
        name: "Form",
        examples: [{
          element: {
            type: "Form",
            props: { title: "Contact" },
            children: [
              { type: "Input", props: { label: "Name", name: "name", placeholder: "Your name" }, key: "f1" },
              { type: "Button", props: { label: "Submit", variant: "primary", action: { name: "submit" } }, key: "f2" },
            ],
          },
        }],
      },
    ],
  },
];

// Helper to convert a single element spec into a UITree
function buildTree(element: { type: string; props: Record<string, unknown>; children?: unknown[] }, rootKey: string): { root: string; elements: Record<string, { key: string; type: string; props: Record<string, unknown>; children?: string[] }> } {
  const elements: Record<string, { key: string; type: string; props: Record<string, unknown>; children?: string[] }> = {};

  function addElement(el: { type: string; props: Record<string, unknown>; children?: unknown[]; key?: string }, key: string): string {
    const childKeys: string[] = [];
    if (el.children && Array.isArray(el.children)) {
      el.children.forEach((child, idx) => {
        if (child && typeof child === 'object' && 'type' in child) {
          const childEl = child as { type: string; props: Record<string, unknown>; children?: unknown[]; key?: string };
          const childKey = childEl.key || `${key}-child-${idx}`;
          childKeys.push(addElement(childEl, childKey));
        }
      });
    }

    elements[key] = {
      key,
      type: el.type,
      props: el.props,
      ...(childKeys.length > 0 ? { children: childKeys } : {}),
    };

    return key;
  }

  addElement(element, rootKey);

  return { root: rootKey, elements };
}

// Component demo wrapper - renders a single example
// Uses inline styles with CSS variables to respect the isolated preview context
const ComponentDemo: React.FC<{
  name: string;
  variantKey?: string;
  variantValue?: string | number;
  element: { type: string; props: Record<string, unknown>; children?: unknown[] };
  uniqueKey: string;
  staggerIndex: number;
}> = ({ name, variantKey, variantValue, element, uniqueKey, staggerIndex }) => {
  useInteractiveState();

  const tree = buildTree(element, uniqueKey);

  return (
    <div
      className="rounded-lg p-4 opacity-0 animate-stagger-fade-in"
      style={{
        animationDelay: `${staggerIndex * 80}ms`,
        border: "1px solid var(--color-border)",
        background: "var(--color-card, var(--color-background))",
      }}
    >
      <div className="flex flex-col gap-1 mb-4">
        <span
          className="text-sm font-medium lowercase"
          style={{ color: "var(--color-foreground)" }}
        >
          {name}
        </span>
        {variantKey && variantValue !== undefined && (
          <span
            className="text-xs"
            style={{ color: "var(--color-muted-foreground, var(--color-foreground))" }}
          >
            {variantKey}: {variantValue}
          </span>
        )}
      </div>
      <div className="min-h-[60px]">
        <JSONUIProvider registry={componentRegistry} initialData={sampleData}>
          <Renderer
            tree={tree}
            registry={componentRegistry}
            fallback={FallbackComponent}
          />
        </JSONUIProvider>
      </div>
    </div>
  );
};

// Toggle button component for light/dark preview mode
const PreviewModeToggle: React.FC<{
  mode: PreviewMode;
  onToggle: () => void;
}> = ({ mode, onToggle }) => (
  <button
    onClick={onToggle}
    className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted transition-colors text-sm"
    title={`Switch to ${mode === "light" ? "dark" : "light"} preview`}
  >
    {mode === "light" ? (
      <>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>Light</span>
      </>
    ) : (
      <>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <span>Dark</span>
      </>
    )}
  </button>
);

export const ComponentsView: React.FC<ComponentsViewProps> = ({
  graph,
  viewMode,
}) => {
  useInteractiveState();
  const [previewMode, setPreviewMode] = useState<PreviewMode>("light");

  const togglePreviewMode = () => {
    setPreviewMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  let staggerIndex = 0;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Header with toggle */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-14 py-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Preview Mode
        </span>
        <PreviewModeToggle mode={previewMode} onToggle={togglePreviewMode} />
      </div>

      {/* Isolated preview container - uses preview-isolated to ignore global .dark */}
      <div
        className={`w-full h-[calc(100%-52px)] overflow-y-auto preview-isolated ${previewMode === "dark" ? "preview-dark" : ""}`}
        style={{
          colorScheme: previewMode,
          background: "var(--color-background)",
        }}
      >
        <div className="px-14 py-8 space-y-12">
          {componentExamples.map((category) => (
            <div key={category.category}>
              <h2
                className="text-2xl font-semibold mb-6 lowercase"
                style={{ color: "var(--color-foreground)" }}
              >
                {category.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.components.flatMap((component) =>
                  component.examples.map((example, idx) => (
                    <ComponentDemo
                      key={`${component.name}-${example.variantValue ?? idx}`}
                      name={component.name}
                      variantKey={example.variantKey}
                      variantValue={example.variantValue}
                      element={example.element}
                      uniqueKey={`demo-${component.name}-${example.variantValue ?? idx}`}
                      staggerIndex={staggerIndex++}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
