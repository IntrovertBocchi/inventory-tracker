/**
 * Formats a price for DISPLAY ONLY - adds comma separators (e.g
 * "12,500.00") for readability. Do not use this on editable input
 * values; use formatPrice for those instead, since commas would break
 * re-parsing the text back into a number.
 */
export function formatCurrency(value) {
    const num = Number(value);
    if (isNaN(num)) {
        return value;
    }
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}