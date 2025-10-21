import crypto from "crypto";

export function NumLength(str: string) {
  const num = str.length;
  return num;
}

export function isPalindrome(str: string) {
  const reverse = str.split("").reverse().join("");
  if (reverse === str) {
    return true;
  }
  return false;
}

export function uniqueCharacterCount(str: string): number {
  const cleaned = str.replace(/\s+/g, ""); // remove all whitespace
  const unique = new Set(cleaned);
  return unique.size;
}

export function wordCount(str: string) {
  const seprateWords = str.split(" ");
  return seprateWords.length;
}

export function hashString(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

export function frequencyCharacterMap(str: string) {
  const freqeuncyMap: Record<string, number> = {};

  for (const word of str) {
    const normalisedChar = word.toLowerCase();
    freqeuncyMap[word] = (freqeuncyMap[normalisedChar] || 0) + 1;
  }

  return freqeuncyMap;
}



export function computeStringProperties(value: string) {
  return {
    length: value.length,
    is_palindrome: isPalindrome(value),
    unique_characters: uniqueCharacterCount(value),
    word_count: wordCount(value),
    sha256_hash: hashString(value),
    character_frequency_map: frequencyCharacterMap(value)
  };
}