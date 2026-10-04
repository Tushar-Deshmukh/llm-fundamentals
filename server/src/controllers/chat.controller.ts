import type { Request, Response } from "express";
import { generateChatResponse } from "../services/llm.service.js";

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
