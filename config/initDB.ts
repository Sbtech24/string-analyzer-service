// src/database/initDB.ts
import pool from "./db";

export async function initializeDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS string_analysis (
      id SERIAL PRIMARY KEY,
      value TEXT NOT NULL,
      length INT NOT NULL,
      is_palindrome BOOLEAN NOT NULL,
      unique_characters INT NOT NULL,
      word_count INT NOT NULL,
      sha256_hash VARCHAR(64) UNIQUE NOT NULL,
      character_frequency_map JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log(" Table 'string_analysis' is ready.");
  } catch (error) {
    console.error("Error creating table:", error);
  }
}
