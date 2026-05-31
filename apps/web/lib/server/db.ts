/**
 * Postgres connection + self-bootstrap for the web app.
 *
 * The first time the app touches the database it ensures the schema exists and
 * seeds the demo dataset if the database is empty — so `docker compose up` (or
 * `npm run db:up` locally) is all that's needed; there is no separate migrate
 * step. Connection comes from DATABASE_URL, or POSTGRES_* with sensible local
 * defaults that match infra/postgres/docker-compose.yml.
 */
import { Pool } from "pg";
import { schemaSql } from "./schema";
import { isEmpty, seedFromFixtures } from "./seed";

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    pool = new Pool({
      connectionString,
      host: connectionString ? undefined : process.env.POSTGRES_HOST ?? "127.0.0.1",
      port: connectionString ? undefined : Number(process.env.POSTGRES_PORT ?? 5432),
      database: connectionString ? undefined : process.env.POSTGRES_DB ?? "ai_lab",
      user: connectionString ? undefined : process.env.POSTGRES_USER ?? "ai_lab",
      password: connectionString ? undefined : process.env.POSTGRES_PASSWORD ?? "ai_lab_password",
      max: Number(process.env.POSTGRES_POOL_MAX ?? 10)
    });
  }
  return pool;
}

let readyPromise: Promise<void> | undefined;

/** Idempotently ensure schema + first seed. Runs at most once per process. */
export function ensureReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = bootstrap().catch((error) => {
      // Reset so a transient failure (e.g. DB still starting) can be retried.
      readyPromise = undefined;
      throw error;
    });
  }
  return readyPromise;
}

async function bootstrap(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(schemaSql);
    await client.query("BEGIN");
    if (await isEmpty(client)) {
      await seedFromFixtures(client);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
