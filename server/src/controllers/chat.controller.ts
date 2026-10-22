import type { Request, Response } from "express";
import {
  generateChatResponse,
  streamChatResponse,
} from "../services/llm.service.js";

type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

function writeSse(res: Response, event: StreamEvent): Promise<boolean> {
  if (res.destroyed || res.writableEnded) {
    return Promise.resolve(false);
  }

  const canContinue = res.write(`data: ${JSON.stringify(event)}\n\n`);

  if (canContinue) {
    return Promise.resolve(true);
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      res.off("drain", onDrain);
      res.off("close", onClose);
      res.off("error", onError);
    };

    const onDrain = () => {
      cleanup();
      resolve(true);
    };

    const onClose = () => {
      cleanup();
      resolve(false);
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    res.once("drain", onDrain);
    res.once("close", onClose);
    res.once("error", onError);

    // The connection may have closed just before listeners were attached.
    if (res.destroyed || res.writableEnded) {
      onClose();
    }
  });
}

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

  const upstreamController = new AbortController();
  let clientDisconnected = false;

  const handleClientDisconnect = () => {
    if (!res.writableEnded) {
      clientDisconnected = true;
      upstreamController.abort();
    }
  };

  // Tell the browser that this response is an SSE stream.
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Send the headers immediately instead of waiting for the first chunk.
  res.flushHeaders();

  //when the controller recevies the abort signal
  res.on("close", handleClientDisconnect);

  try {
    const stream = await streamChatResponse({
      prompt: prompt.trim(),
      systemPrompt,
      signal: upstreamController.signal,
    });

    for await (const chunk of stream) {
      if (
        clientDisconnected ||
        upstreamController.signal.aborted ||
        res.destroyed
      ) {
        break;
      }

      const text = chunk.choices[0]?.delta?.content;

      if (typeof text !== "string" || text.length === 0) {
        continue;
      }

      const canContinue = await writeSse(res, {
        type: "delta",
        text,
      });

      if (!canContinue) {
        clientDisconnected = true;
        upstreamController.abort();
        break;
      }
    }

    if (
      !clientDisconnected &&
      !upstreamController.signal.aborted &&
      !res.destroyed
    ) {
      const canContinue = await writeSse(res, { type: "done" });

      if (canContinue && !res.destroyed && !res.writableEnded) {
        res.end();
      }
    }
  } catch (error) {
    if (
      !clientDisconnected &&
      !upstreamController.signal.aborted &&
      !res.destroyed &&
      !res.writableEnded
    ) {
      console.error("LLM streaming failed:", error);

      try {
        await writeSse(res, {
          type: "error",
          message: "The LLM response could not be completed.",
        });
      } catch (writeError) {
        console.error("Failed to write streaming error:", writeError);
      }

      if (!res.destroyed && !res.writableEnded) {
        res.end();
      }
    }
  } finally {
    res.off("close", handleClientDisconnect);

    if (clientDisconnected && !upstreamController.signal.aborted) {
      upstreamController.abort();
    }
  }
}
