import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, ".env") });

import { defineConfig } from "drizzle-kit";

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: connectionString
    ? { url: connectionString }
    : {
        host: process.env.PGHOST!,
        port: parseInt(process.env.PGPORT || "5432", 10),
        user: process.env.PGUSER!,
        password: process.env.PGPASSWORD!,
        database: process.env.PGDATABASE || "postgres",
        ssl: { rejectUnauthorized: false },
      },
});
