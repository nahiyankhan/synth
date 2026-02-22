/**
 * useSSEConnection - Hook for managing SSE connections via POST requests
 *
 * Handles fetch + ReadableStream management for server-sent events.
 */

import { useRef, useEffect, useCallback } from "react";
import { getApiKeyHeaders } from "@/utils/apiKeyStorage";

export interface SSEEvent {
  type: string;
  [key: string]: unknown;
}

export interface UseSSEConnectionOptions {
  /** Called when an SSE event is received */
  onEvent: (event: SSEEvent) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Called when the connection is aborted */
  onAbort?: () => void;
}

export interface SSEConnectionReturn {
  /** Send a POST request and process the SSE stream */
  connect: (url: string, body: unknown) => Promise<void>;
  /** Abort the current connection */
  abort: () => void;
  /** Whether a connection is currently active */
  isConnected: boolean;
}

/**
 * Hook for managing SSE connections via POST requests.
 *
 * Handles:
 * - POST request with fetch
 * - ReadableStream reading with TextDecoder
 * - Buffer management for SSE format parsing
 * - Abort controller management
 * - Error handling
 */
export function useSSEConnection({
  onEvent,
  onError,
  onAbort,
}: UseSSEConnectionOptions): SSEConnectionReturn {
  const abortControllerRef = useRef<AbortController | null>(null);
  const isConnectedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    isConnectedRef.current = false;
    onAbort?.();
  }, [onAbort]);

  const connect = useCallback(
    async (url: string, body: unknown) => {
      // Abort any existing connection
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      isConnectedRef.current = true;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getApiKeyHeaders(),
          },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse SSE format: "data: {...}\n\n"
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6).trim();
                if (jsonStr) {
                  try {
                    const data = JSON.parse(jsonStr);
                    onEvent(data);
                  } catch {
                    // Ignore JSON parse errors
                  }
                }
              }
            }
          }
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            console.error("Stream reading error:", error);
            onError?.("Connection error during generation.");
          }
        } finally {
          isConnectedRef.current = false;
        }
      } catch (error) {
        isConnectedRef.current = false;
        if ((error as Error).name !== "AbortError") {
          console.error("POST request failed:", error);
          onError?.(
            error instanceof Error ? error.message : "Failed to start connection"
          );
        }
      }
    },
    [onEvent, onError]
  );

  return {
    connect,
    abort,
    get isConnected() {
      return isConnectedRef.current;
    },
  };
}
