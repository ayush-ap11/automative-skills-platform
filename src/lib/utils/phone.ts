/**
 * Utility for Australian phone and mobile number formatting.
 *
 * Australian phone standards:
 * - Mobile: 04XX XXX XXX (10 digits starting with 04)
 * - Mobile (international format digits): 4XX XXX XXX (9 digits starting with 4)
 * - Landline: 0X XXXX XXXX (10 digits starting with 02, 03, 07, 08)
 */

export function formatAustralianPhone(raw: string): string {
  if (!raw) return "";

  // Strip all non-digit characters
  let digits = raw.replace(/\D/g, "");

  // If the user entered country code 61 at the start, remove it
  if (digits.startsWith("61") && digits.length > 2) {
    digits = digits.slice(2);
  }

  // Mobile starting with 04 (e.g. 0412 345 678)
  if (digits.startsWith("04")) {
    const d = digits.slice(0, 10);
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  }

  // Mobile starting with 4 without leading 0 (e.g. 412 345 678)
  if (digits.startsWith("4")) {
    const d = digits.slice(0, 9);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  }

  // Landline with area code starting with 0 (e.g. 02 9876 5432)
  if (digits.startsWith("0")) {
    const d = digits.slice(0, 10);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
    return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`;
  }

  // Fallback for general digits: 3-3-4 grouping up to 10 digits
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}
