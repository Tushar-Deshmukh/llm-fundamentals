export interface ChatRequest {
  prompt: string;
  systemPrompt?: string;
}

export interface ChatResponse {
  success: boolean;
  data: {
    response: string;
  };
}

type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

interface StreamChatInput {
  prompt: string;
  systemPrompt?: string;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
}

const BASE_URL = "http://localhost:5000/api";

//chat response
export async function sendChatRequest(
  request: ChatRequest,
): Promise<ChatResponse> {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Failed to send chat request");
  }

  return response.json();
}

//stream response
export async function streamChatResponse({
  prompt,
  systemPrompt,
  signal,
  onDelta,
}: StreamChatInput): Promise<void> {
  const response = await fetch(`${BASE_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ prompt, systemPrompt }),
    signal,
  });

  // Errors before streaming starts may still be normal JSON responses.
  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Streaming request failed (${response.status}): ${message}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/event-stream")) {
    throw new Error("Expected an SSE response from the server.");
  }

  if (!response.body) {
    throw new Error("The browser did not provide a readable response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let completed = false;

  function processEvent(rawEvent: string): void {
    const dataLines = rawEvent
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, ""));

    if (dataLines.length === 0) return;

    const data = dataLines.join("\n");
    const event: unknown = JSON.parse(data);

    if (typeof event !== "object" || event === null || !("type" in event)) {
      throw new Error("Received an invalid streaming event.");
    }

    const parsed = event as StreamEvent;

    switch (parsed.type) {
      case "delta":
        if (typeof parsed.text !== "string") {
          throw new Error("Received an invalid text chunk.");
        }

        onDelta(parsed.text);
        break;

      case "done":
        completed = true;
        break;

      case "error":
        if (typeof parsed.message !== "string") {
          throw new Error("The server reported an unknown streaming error.");
        }

        throw new Error(parsed.message);

      default:
        throw new Error("Received an unsupported streaming event.");
    }
  }

  try {
    while (!completed) {
      const { value, done } = await reader.read();

      buffer += done
        ? decoder.decode()
        : decoder.decode(value, { stream: true });

      // SSE permits CRLF line endings. Normalize them before parsing.
      buffer = buffer.replace(/\r\n/g, "\n");

      // One SSE event ends at a blank line.
      let boundary = buffer.indexOf("\n\n");

      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        processEvent(rawEvent);

        if (completed) break;

        boundary = buffer.indexOf("\n\n");
      }

      if (done) {
        // Accept a final event without a trailing blank line.
        if (!completed && buffer.trim()) {
          processEvent(buffer);
          buffer = "";
        }

        if (!completed) {
          throw new Error(
            "The stream ended before a completion event was received.",
          );
        }

        break;
      }
    }
  } finally {
    if (!completed) {
      try {
        await reader.cancel();
      } catch {
        // The stream may already be aborted or closed.
      }
    }

    reader.releaseLock();
  }
}
