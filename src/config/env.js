// src/config/env.js
import { z } from "zod";
import "dotenv/config"; // Ensure dotenv loads before we validate

// 1. Define the strict schema rules
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("5001"), // Environment variables always come in as strings
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid URL/connection string"),
  JWT_SECRET: z
    .string()
    .min(10, "JWT_SECRET must be at least 10 characters long to be secure"),
});

// 2. Parse the current process.env against the schema
const _env = envSchema.safeParse(process.env);

// 3. If validation fails, format the errors and crash gracefully
if (!_env.success) {
  console.error("❌ FATAL ERROR: Invalid environment variables\n");

  // This formats the Zod errors into a clean, readable object
  const formattedErrors = _env.error.format();

  for (const [key, value] of Object.entries(formattedErrors)) {
    if (key !== "_errors") {
      console.error(
        `Missing or Invalid -> ${key}: ${value._errors.join(", ")}`,
      );
    }
  }

  // Kill the Node process with an exit code of 1 (failure)
  process.exit(1);
}

// 4. Export the validated, safe environment object
export const env = _env.data;
