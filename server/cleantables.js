import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db/connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleantables() {
  const client = await pool.connect();

  try {
    // Create a table to track which migrations have been applied
    await client.query(`
      DROP TABLE IF EXISTS schema_migrations CASCADE;
      DROP TABLE IF EXISTS votes CASCADE;
      DROP TABLE IF EXISTS options CASCADE;
      DROP TABLE IF EXISTS polls CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log("All tables cleaned.");
  } finally {
    client.release();
    await pool.end();
  }
}

cleantables();
