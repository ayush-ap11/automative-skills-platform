import { randomInt } from "node:crypto";

/**
 * Generates a cryptographically secure 12-character temporary password mixing
 * uppercase, lowercase, digits, and special characters.
 */
export function generateTemporaryPassword(): string {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // omitted easily confused characters like I, O
  const lowercase = "abcdefghijkmnopqrstuvwxyz"; // omitted l
  const digits = "23456789"; // omitted 0, 1
  const symbols = "!@#$%^&*()-_=+";

  const allChars = uppercase + lowercase + digits + symbols;

  // Guarantee at least one character from each set
  const passwordChars = [
    uppercase[randomInt(0, uppercase.length)],
    lowercase[randomInt(0, lowercase.length)],
    digits[randomInt(0, digits.length)],
    symbols[randomInt(0, symbols.length)],
  ];

  // Fill the remaining 8 characters from the combined set
  for (let i = 0; i < 8; i++) {
    passwordChars.push(allChars[randomInt(0, allChars.length)]);
  }

  // Cryptographically secure Fisher-Yates shuffle to randomize positions
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join("");
}
