import { z } from "zod";

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const extractedDetailsSchema = z.object({
  name: z.string().trim().min(1).nullable(),
  date: z
    .string()
    .refine(isValidIsoDate, "Expected a real date in YYYY-MM-DD format")
    .nullable(),
  amount: z.number().finite().nonnegative().nullable(),
}).strict();

export type ExtractedDetails = z.infer<
  typeof extractedDetailsSchema
>;