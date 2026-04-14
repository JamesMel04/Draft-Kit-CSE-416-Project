import dotenv from 'dotenv';
dotenv.config();

export function requiredEnv(variableName: string): any {
  const value = process.env[variableName];
  if (!value) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }
  return value;
}

export function optionalEnv(variableName: string, defaultValue: any): any {
  const value = process.env[variableName];
  if (!value) {
    return defaultValue;
  }
  return value;
}