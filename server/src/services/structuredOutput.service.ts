import { llmClient } from "./llm.client.js";
import { env } from "../config/env.js";
import { extractedDetailsSchema } from "../schemas/structuredOutput.schema.js";
import { StructuredOutputError } from "../errors/structuredOutputError.js";

type ExtractedDetails = {
  name: string | null;
  date: string | null;
  amount: number | null;
};

export async function extractStructuredData(
  input: string,
): Promise<ExtractedDetails> {
  const completion = await llmClient.chat.completions.create({
    model: env.llm.model,
    messages: [
      {
        role: "system",
        content: `
You extract structured information from user-provided text.

Return a JSON object with exactly these keys:
- name: string or null
- date: string in YYYY-MM-DD format or null
- amount: number or null

Rules:
- Extract only information supported by the input.
- Never invent missing information.
- Convert unambiguous dates to YYYY-MM-DD.
- Return amounts as numbers, without currency symbols.
- If a field is missing or cannot be determined reliably, use null.
- Return JSON only.
        `.trim(),
      },
      {
        role: "user",
        content: input,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("The model returned an empty structured response.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new StructuredOutputError(
      "LLM returned invalid JSON.",
      "INVALID_JSON",
    );
  }

  const result = extractedDetailsSchema.safeParse(parsed);

  if (!result.success) {
    console.error("LLM output failed schema validation:", result.error.issues);

    throw new StructuredOutputError(
      "LLM returned data in an unexpected format.",
      "INVALID_SCHEMA",
    );
  }

  return result.data;
}
