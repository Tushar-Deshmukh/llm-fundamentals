import OpenAI from "openai";
import { env } from "../config/env.js";

export const llmClient = new OpenAI({
  apiKey: env.llm.apiKey,
  baseURL: env.llm.baseUrl,
});