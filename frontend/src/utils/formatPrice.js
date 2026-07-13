/**
 * Formats a price for an EDITABLE input field (e.g. on blur). Produces a
 * plain "100.00" style string with no thousands separators, since this 
 * value may still be typed into and re-parsed as a number later - adding
 * commas here would break that.
 * 
 * For DISPLAY-ONLY prices (table cells, totals), use formatCurrency
 * instead, which adds comma separators for readability.
 */
export function formatPrice(value) {
  const price = Number(value);
  if (value !== "" && !isNaN(price)) {
    return price.toFixed(2);
  }
  return value;
}