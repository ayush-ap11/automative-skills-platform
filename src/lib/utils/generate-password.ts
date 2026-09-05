/**
 * Generates a secure 12-character temporary password mixing
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
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  // Fill the remaining 8 characters from the combined set
  for (let i = 0; i < 8; i++) {
    passwordChars.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Fisher-Yates shuffle to randomize positions
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join("");
}
