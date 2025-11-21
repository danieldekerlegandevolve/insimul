import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Drizzle Postgres database for Talk of the Town / analytics features.
// In the default MongoDB setup, this is optional and only used by
// services that rely on PostgreSQL tables defined in @shared/schema.

type DrizzleDb = ReturnType<typeof drizzle>;

let db: DrizzleDb;

const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
  const sql = neon(DATABASE_URL);
  db = drizzle(sql, { schema });
} else {
  console.warn(
    "DATABASE_URL is not set; Postgres-backed features (e.g. reputation service) are disabled."
  );

  const notConfigured = () => {
    throw new Error(
      "Postgres database is not configured. Set DATABASE_URL to enable this feature."
    );
  };

  db = {
    select: notConfigured,
    insert: notConfigured,
    update: notConfigured,
    delete: notConfigured,
  } as unknown as DrizzleDb;
}

export { db };
