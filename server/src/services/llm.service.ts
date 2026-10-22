import { llmClient } from "./llm.client.js";
import { env } from "../config/env.js";

export interface ChatInput {
  prompt: string;
  systemPrompt?: string;
}

export async function generateChatResponse({
  prompt,
  systemPrompt,
}: ChatInput): Promise<string> {
  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: "system" as const,
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user" as const,
    content: prompt,
  });

  const response = await llmClient.chat.completions.create({
    model: env.llm.model,
    messages,
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function streamChatResponse({
  prompt,
  systemPrompt,
  signal,
}: {
  prompt: string;
  systemPrompt?: string;
  signal?: AbortSignal;
}) {
  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: "system" as const,
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user" as const,
    content: prompt,
  });

  return llmClient.chat.completions.create(
    {
      model: env.llm.model,
      messages,
      stream: true,
    },
    { signal },
  );
}
