export class StructuredOutputError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_JSON" | "INVALID_SCHEMA",
  ) {
    super(message);
    this.name = "StructuredOutputError";
  }
}
