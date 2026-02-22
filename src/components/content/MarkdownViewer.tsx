/**
 * MarkdownViewer - Renders markdown content with custom styling
 */

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface MarkdownViewerProps {
  markdown: string;
  className?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  markdown,
  className = "",
}) => {
  // Helper to generate ID from text
  const generateId = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Process markdown to add styling hints for checkmarks
  const processedMarkdown = React.useMemo(() => {
    return markdown
      .replace(/✔/g, '<span class="checkmark-yes">✔</span>')
      .replace(/✘/g, '<span class="checkmark-no">✘</span>');
  }, [markdown]);

  return (
    <div className={`markdown-viewer ${className}`}>
      <style>{`
        .markdown-viewer .checkmark-yes {
          color: #16a34a;
          font-weight: 600;
        }
        .dark .markdown-viewer .checkmark-yes {
          color: #4ade80;
        }
        .markdown-viewer .checkmark-no {
          color: #dc2626;
          font-weight: 600;
        }
        .dark .markdown-viewer .checkmark-no {
          color: #f87171;
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Custom heading renderer with anchor support
          h1: ({ children, id }) => {
            const text =
              typeof children === "string" ? children : String(children);
            const headingId = id || generateId(text);
            return (
              <h1
                id={headingId}
                className="text-4xl font-light mb-6 mt-12 text-dark-900"
              >
                {children}
              </h1>
            );
          },
          h2: ({ children, id }) => {
            const text =
              typeof children === "string" ? children : String(children);
            const headingId = id || generateId(text);
            return (
              <h2
                id={headingId}
                className="text-3xl font-light mb-4 mt-10 text-dark-900"
              >
                {children}
              </h2>
            );
          },
          h3: ({ children, id }) => {
            const text =
              typeof children === "string" ? children : String(children);
            const headingId = id || generateId(text);
            return (
              <h3
                id={headingId}
                className="text-2xl font-light mb-3 mt-8 text-dark-900"
              >
                {children}
              </h3>
            );
          },
          h4: ({ children, id }) => {
            const text =
              typeof children === "string" ? children : String(children);
            const headingId = id || generateId(text);
            return (
              <h4
                id={headingId}
                className="text-xl font-medium mb-2 mt-6 text-dark-900"
              >
                {children}
              </h4>
            );
          },
          // Paragraphs
          p: ({ children }) => (
            <p className="text-base leading-relaxed mb-4 text-dark-700">
              {children}
            </p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-dark-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-dark-700">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="ml-4">{children}</li>,
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-dark-200">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-dark-100">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-dark-700">
              {children}
            </td>
          ),
          // Code blocks
          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code className="px-2 py-1 bg-dark-100 text-dark-900 rounded font-mono text-sm">
                  {children}
                </code>
              );
            }
            return (
              <code className="block p-4 bg-dark-100 text-dark-900 rounded font-mono text-sm overflow-x-auto mb-4">
                {children}
              </code>
            );
          },
          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-blue-600 hover:underline"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-dark-300 pl-4 italic mb-4 text-dark-600">
              {children}
            </blockquote>
          ),
          // Horizontal rule
          hr: () => (
            <hr className="my-8 border-dark-200" />
          ),
          // Images - filter out empty src attributes
          img: ({ src, alt, title }) => {
            // Don't render images with empty or missing src
            if (!src || src.trim() === "") {
              // Return a span instead of null to avoid React warnings
              return <span style={{ display: 'none' }} />;
            }
            return (
              <img
                src={src}
                alt={alt || ""}
                title={title}
                className="max-w-full h-auto rounded-lg my-4"
              />
            );
          },
        }}
      >
        {processedMarkdown}
      </ReactMarkdown>
    </div>
  );
};
