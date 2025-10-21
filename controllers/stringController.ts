import { Request, Response, NextFunction } from "express";
import conn from "../config/db";
import { hashString, computeStringProperties } from "../utils/stringUtils";

//  CREATE /strings
export async function createString(req: Request, res: Response, next: NextFunction) {
  try {
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ error: "Invalid or missing 'value' field" });
    }

    if ( typeof value !== "string") {
      return res.status(422).json({ error: "Invalid data type for value must be string" });
    }

    // compute properties
    const properties = computeStringProperties(value);
    const { length, is_palindrome, unique_characters, word_count, character_frequency_map } = properties;
    const sha256_hash = hashString(value);

    // check if exists
    const existing = await conn.query("SELECT * FROM string_analysis WHERE sha256_hash = $1", [sha256_hash]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "String already exists in the system" });
    }

    // insert into db
    const query = `
      INSERT INTO string_analysis (
        value, length, is_palindrome, unique_characters, word_count, sha256_hash, character_frequency_map
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      value,
      length,
      is_palindrome,
      unique_characters,
      word_count,
      sha256_hash,
      JSON.stringify(character_frequency_map),
    ];

    const result = await conn.query(query, values);
    const created = result.rows[0];

    res.status(201).json({
      id: created.sha256_hash,
      value: created.value,
      properties: {
        length: created.length,
        is_palindrome: created.is_palindrome,
        unique_characters: created.unique_characters,
        word_count: created.word_count,
        sha256_hash: created.sha256_hash,
        character_frequency_map: created.character_frequency_map,
      },
      created_at: created.created_at,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
}

// GET /strings/:value
export async function getString(req: Request, res: Response, next: NextFunction) {
  try {
    const { value } = req.params;
    
    if(!value){
        return 
    }
    const sha256_hash = hashString(value);

    const result = await conn.query("SELECT * FROM string_analysis WHERE sha256_hash = $1", [sha256_hash]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "String not found" });
    }

    const data = result.rows[0];
    res.json({
      id: data.sha256_hash,
      value: data.value,
      properties: {
        length: data.length,
        is_palindrome: data.is_palindrome,
        unique_characters: data.unique_characters,
        word_count: data.word_count,
        sha256_hash: data.sha256_hash,
        character_frequency_map: data.character_frequency_map,
      },
      created_at: data.created_at,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
}

// GET /strings (with filters)
export async function getAllStrings(req: Request, res: Response, next: NextFunction) {
  try {
    const { is_palindrome, min_length, max_length, word_count, contains_character } = req.query;

    let query = "SELECT * FROM string_analysis WHERE 1=1";
    const params: any[] = [];

    if (is_palindrome !== undefined) {
      params.push(is_palindrome === "true");
      query += ` AND is_palindrome = $${params.length}`;
    }

    if (min_length) {
      params.push(Number(min_length));
      query += ` AND length >= $${params.length}`;
    }

    if (max_length) {
      params.push(Number(max_length));
      query += ` AND length <= $${params.length}`;
    }

    if (word_count) {
      params.push(Number(word_count));
      query += ` AND word_count = $${params.length}`;
    }

    if (contains_character) {
      params.push(`%${contains_character}%`);
      query += ` AND value ILIKE $${params.length}`;
    }

    query += " ORDER BY created_at DESC;";

    const result = await conn.query(query, params);

    res.json({
      count: result.rowCount,
      data: result.rows,
      filters_applied: {
        is_palindrome,
        min_length,
        max_length,
        word_count,
        contains_character,
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
}

// GET /strings/filter-by-natural-language?query=something
export async function filterByNaturalLanguage(req: Request, res: Response, next: NextFunction) {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const interpreted = parseNaturalLanguageQuery(query.toLowerCase());
    if (!interpreted) {
      return res.status(400).json({ error: "Unable to parse natural language query" });
    }

    // --- Build SQL dynamically ---
    let sql = "SELECT * FROM string_analysis WHERE 1=1";
    const params: any[] = [];

    if (interpreted.word_count !== undefined) {
      params.push(interpreted.word_count);
      sql += ` AND word_count = $${params.length}`;
    }

    if (interpreted.is_palindrome !== undefined) {
      params.push(interpreted.is_palindrome);
      sql += ` AND is_palindrome = $${params.length}`;
    }

    if (interpreted.min_length !== undefined) {
      params.push(interpreted.min_length);
      sql += ` AND length >= $${params.length}`;
    }

    if (interpreted.contains_character) {
      params.push(`%${interpreted.contains_character}%`);
      sql += ` AND value ILIKE $${params.length}`;
    }

    sql += " ORDER BY created_at DESC;";

    const result = await conn.query(sql, params);

    res.status(200).json({
      data: result.rows,
      count: result.rowCount,
      interpreted_query: {
        original: query,
        parsed_filters: interpreted,
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
}

// --- Natural language parser helper ---
function parseNaturalLanguageQuery(query: string) {
  const filters: any = {};

  // Palindrome detection
  if (query.includes("palindromic") || query.includes("palindrome"))
    filters.is_palindrome = true;

  // Word count patterns
  if (query.includes("single word") || query.includes("one word"))
    filters.word_count = 1;
  if (query.includes("two words") || query.includes("double word"))
    filters.word_count = 2;

  // Length detection
  const longerThanMatch = query.match(/longer than (\d+)/);
  if (longerThanMatch) {
    const parsed = parseInt(longerThanMatch[1] ?? "", 10);
    if (!isNaN(parsed)) filters.min_length = parsed + 1;
  }

  // Containing character
  const containsLetterMatch = query.match(/containing the letter (\w)/);
  if (containsLetterMatch)
    filters.contains_character = containsLetterMatch[1];

  // Heuristic: “contain the first vowel”
  if (query.includes("first vowel"))
    filters.contains_character = "a";

  if (Object.keys(filters).length === 0)
    return null;

  return filters;
}



export async function deleteString(req: Request, res: Response, next: NextFunction) {
  try {
    const { value } = req.params;
      
    if(!value){
        return 
    }
    const sha256_hash = hashString(value);

    const result = await conn.query("DELETE FROM string_analysis WHERE sha256_hash = $1 RETURNING *", [sha256_hash]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "String not found" });
    }

    res.json({ message: "String deleted successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
}
