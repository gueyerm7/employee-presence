export function fmtHours(value) {
  if (value === null || value === undefined || value === '') return '--';
  const num = Number(value);
  if (isNaN(num)) return '--';
  return num.toFixed(2) + 'h';
}
