export function normalizeDob(value) {
  const match = /^(\d{2})(\d{2})(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (year < 1 || month < 1 || month > 12) return null;

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonth[month - 1]) return null;

  const today = new Date();
  if (
    year > today.getFullYear()
    || (year === today.getFullYear() && month > today.getMonth() + 1)
    || (year === today.getFullYear() && month === today.getMonth() + 1 && day > today.getDate())
  ) {
    return null;
  }

  return `${match[1]}${match[2]}${match[3]}`;
}
