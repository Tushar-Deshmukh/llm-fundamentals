import type { Request, Response } from "express";
import {
  generateChatResponse,
  streamChatResponse,
} from "../services/llm.service.js";

export async function chatController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { prompt, systemPrompt } = req.body;

    if (
      !prompt ||
      typeof prompt !== "string" ||
      (systemPrompt !== undefined && typeof systemPrompt !== "string")
    ) {
      res.status(400).json({
        success: false,
        error: "Invalid request",
      });

      return;
    }

    const response = await generateChatResponse({
      prompt,
      systemPrompt,
    });

    res.json({
      success: true,
      data: {
        response,
      },
    });
  } catch (error) {
    console.error("LLM request failed:", error);

    res.status(500).json({
      success: false,
      error: "Failed to generate LLM response",
    });
  }
}

export async function streamChat(req: Request, res: Response): Promise<void> {
  const { prompt, systemPrompt } = req.body ?? {};

  // Validate before starting the stream.
  if (typeof prompt !== "string" || !prompt.trim()) {
    res.status(400).json({
      message: "A non-empty prompt is required.",
    });
    return;
  }

  if (systemPrompt !== undefined && typeof systemPrompt !== "string") {
    res.status(400).json({
      message: "systemPrompt must be a string.",
    });
    return;
  }

  // Tell the browser that this response is an SSE stream.
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Send the headers immediately instead of waiting for the first chunk.
  res.flushHeaders();

  try {
    const stream = await streamChatResponse({
      prompt: prompt.trim(),
      systemPrompt,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;

      // Some chunks contain metadata rather than text.
      if (typeof text === "string" && text.length > 0) {
        res.write(
          `data: ${JSON.stringify({
            type: "delta",
            text,
          })}\n\n`,
        );
      }
    }

    // Explicitly tell the client that generation is complete.
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
    }
  } catch (error) {
    // Keep provider details in server logs, not in the public response.
    console.error("LLM streaming failed:", error);

    // Once headers are sent, we cannot switch to an ordinary JSON error.
    if (!res.destroyed && !res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: "The LLM response could not be completed.",
        })}\n\n`,
      );
      res.end();
    }
  }
}
