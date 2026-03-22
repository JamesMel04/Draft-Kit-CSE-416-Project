export function parseStringQuery(value: unknown, defaultValue: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return defaultValue;
}


export function parseBoolean(value: unknown, defaultValue: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return defaultValue;
}

export function parsePositiveInt(value: unknown, defaultValue: number): number {
  const parsedNum = Number(value);
  return Number.isInteger(parsedNum) && parsedNum > 0 ? parsedNum : defaultValue;
}