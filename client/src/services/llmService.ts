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

export async function sendChatRequest(
  request: ChatRequest,
): Promise<ChatResponse> {
  const response = await fetch(
    "http://localhost:5000/api/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to send chat request");
  }

  return response.json();
}