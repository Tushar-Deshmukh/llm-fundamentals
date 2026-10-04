import "dotenv/config";

const requiredEnvVariables = [
  "LLM_API_KEY",
  "LLM_BASE_URL",
  "LLM_MODEL",
] as const;

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,

  llm: {
    apiKey: process.env.LLM_API_KEY,
    baseUrl: process.env.LLM_BASE_URL,
    model: process.env.LLM_MODEL || "",
  },
};