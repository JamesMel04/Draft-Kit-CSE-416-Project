export function parseStringQuery(value: unknown, defaultValue: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string' && item.trim().length > 0);
    if (first) {
      return first.trim();
    }
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

export function parseCsvQuery(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => (typeof item === 'string' ? item.split(',') : []))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

export function parseOptionalNumberQuery(value: unknown): number | undefined {
  const normalized = parseStringQuery(value, '');
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseRouteParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function parseRoster(roster: unknown): Record<string, string> {
  if (typeof roster !== 'object' || roster === null) {
    return {};
  }
  
  return Object.fromEntries(
    Object.entries(roster).map(([key, value]) => [key, parseStringQuery(value, '')])
  );
}