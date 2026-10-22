import type { Request, Response } from "express";
import { extractStructuredData } from "../services/structuredOutput.service.js";
import { StructuredOutputError } from "../errors/structuredOutputError.js";

export async function structuredOutputController(req: Request, res: Response) {
  const { input } = req.body ?? {};

  if (typeof input !== "string" || !input.trim()) {
    return res.status(400).json({
      error: "A non-empty input string is required.",
    });
  }

  try {
    const data = await extractStructuredData(input.trim());

    return res.status(200).json({ data });
  } catch (error) {
    console.error("Structured output generation failed:", error);

    if (error instanceof StructuredOutputError) {
      return res.status(502).json({
        error: "The model returned an invalid response.",
        code: error.code,
      });
    }

    return res.status(502).json({
      error: "Unable to generate structured output.",
      code: "GENERATION_FAILED",
    });
  }
}
